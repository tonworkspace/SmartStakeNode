-- Complete setup script for offline earnings and cron job system
-- Run this script in your Supabase SQL editor

-- 1. First, run the offline earnings system
\i create_offline_earnings_system.sql

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 3. Create cron logs table
CREATE TABLE IF NOT EXISTS cron_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  response TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create function to trigger Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_rewards_processing()
RETURNS void AS $$
DECLARE
  response http_response;
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get configuration (you'll need to set these)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings are not configured, use environment or skip
  IF supabase_url IS NULL OR service_key IS NULL THEN
    INSERT INTO cron_logs (job_name, error, created_at)
    VALUES ('daily_rewards_processing', 'Supabase URL or Service Key not configured', NOW());
    RETURN;
  END IF;
  
  -- Call the Edge Function
  SELECT * INTO response
  FROM http_post(
    supabase_url || '/functions/v1/process-daily-rewards',
    '{}',
    'application/json',
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_key),
      http_header('Content-Type', 'application/json')
    ]
  );
  
  -- Log the response
  INSERT INTO cron_logs (job_name, response, created_at)
  VALUES ('daily_rewards_processing', response.content, NOW());
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO cron_logs (job_name, error, created_at)
  VALUES ('daily_rewards_processing', SQLERRM, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Alternative direct processing function (if Edge Functions are not available)
CREATE OR REPLACE FUNCTION process_all_daily_rewards()
RETURNS JSON AS $$
DECLARE
  stake_record RECORD;
  user_record RECORD;
  total_processed INTEGER := 0;
  total_earnings DECIMAL := 0;
  errors TEXT[] := ARRAY[]::TEXT[];
  result JSON;
BEGIN
  -- Process all eligible stakes
  FOR stake_record IN 
    SELECT s.*, u.rank, u.speed_boost_active,
           EXTRACT(EPOCH FROM (NOW() - s.last_payout)) / 86400 as days_since_payout,
           EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400 as days_since_creation
    FROM stakes s 
    JOIN users u ON s.user_id = u.id
    WHERE s.is_active = true
    AND s.last_payout < NOW() - INTERVAL '24 hours'
  LOOP
    BEGIN
      -- Calculate earnings using the same logic as the Edge Function
      DECLARE
        base_daily_roi DECIMAL;
        duration_bonus DECIMAL;
        rank_bonus DECIMAL;
        daily_roi DECIMAL;
        daily_earning DECIMAL;
        max_daily_earning DECIMAL;
        days_to_process INTEGER;
        total_earning DECIMAL;
        new_total_earned DECIMAL;
        cycle_progress DECIMAL;
      BEGIN
        -- Base ROI calculation
        base_daily_roi := CASE 
          WHEN stake_record.amount >= 1000 THEN 0.03
          WHEN stake_record.amount >= 500 THEN 0.025
          WHEN stake_record.amount >= 100 THEN 0.02
          WHEN stake_record.amount >= 50 THEN 0.015
          ELSE 0.01
        END;
        
        -- Duration bonus
        duration_bonus := LEAST(stake_record.days_since_creation * 0.0001, 0.005);
        
        -- Rank bonus
        rank_bonus := CASE 
          WHEN stake_record.rank = 'GUARDIAN' THEN 0.1
          WHEN stake_record.rank = 'SOVEREIGN' THEN 0.15
          WHEN stake_record.rank = 'CELESTIAL' THEN 0.2
          ELSE 0
        END;
        
        -- Calculate final ROI
        daily_roi := base_daily_roi + duration_bonus;
        daily_roi := daily_roi * (1 + rank_bonus);
        
        -- Calculate daily earning
        daily_earning := stake_record.amount * daily_roi;
        
        -- Apply speed boost
        IF stake_record.speed_boost_active THEN
          daily_earning := daily_earning * 1.5;
        END IF;
        
        -- Cap earnings
        max_daily_earning := LEAST(stake_record.amount * 0.03, 1000);
        daily_earning := LEAST(daily_earning, max_daily_earning);
        
        -- Calculate days to process (max 7 for offline users)
        days_to_process := LEAST(FLOOR(stake_record.days_since_payout), 7);
        total_earning := daily_earning * days_to_process;
        
        IF total_earning > 0 THEN
          -- Update stake
          new_total_earned := stake_record.total_earned + total_earning;
          cycle_progress := LEAST((new_total_earned / stake_record.amount) * 100, 300);
          
          UPDATE stakes 
          SET 
            total_earned = new_total_earned,
            last_payout = NOW(),
            daily_rate = daily_roi,
            cycle_progress = cycle_progress
          WHERE id = stake_record.id;
          
          -- Update user earnings
          UPDATE users 
          SET 
            available_earnings = COALESCE(available_earnings, 0) + total_earning,
            total_earned = COALESCE(total_earned, 0) + total_earning,
            last_active = NOW()
          WHERE id = stake_record.user_id;
          
          -- Record earning history
          INSERT INTO earning_history (
            stake_id, user_id, amount, type, created_at,
            roi_rate, base_rate, rank_bonus, duration_multiplier, days_processed
          ) VALUES (
            stake_record.id, stake_record.user_id, total_earning, 'daily_roi_direct',
            NOW(), daily_roi * 100, base_daily_roi * 100, rank_bonus, 1 + duration_bonus, days_to_process
          );
          
          total_processed := total_processed + 1;
          total_earnings := total_earnings + total_earning;
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, 'Stake ' || stake_record.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  -- Handle cycle completions
  UPDATE stakes 
  SET 
    is_active = false,
    cycle_completed = true,
    cycle_completed_at = NOW()
  WHERE is_active = true AND cycle_progress >= 300;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'total_processed', total_processed,
    'total_earnings', total_earnings,
    'errors', CASE WHEN array_length(errors, 1) > 0 THEN errors ELSE NULL END,
    'timestamp', NOW()
  );
  
  -- Log the result
  INSERT INTO cron_logs (job_name, response, created_at)
  VALUES ('direct_daily_processing', result::TEXT, NOW());
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Schedule cron jobs
-- Option 1: Using Edge Function (recommended)
SELECT cron.schedule(
  'daily-rewards-edge-function',
  '0 * * * *', -- Every hour
  'SELECT trigger_daily_rewards_processing();'
);

-- Option 2: Direct processing (fallback)
SELECT cron.schedule(
  'daily-rewards-direct',
  '30 * * * *', -- Every hour at 30 minutes (as backup)
  'SELECT process_all_daily_rewards();'
);

-- 7. Cleanup job
SELECT cron.schedule(
  'cleanup-cron-logs',
  '0 2 * * *', -- Daily at 2 AM
  'DELETE FROM cron_logs WHERE created_at < NOW() - INTERVAL ''7 days'';'
);

-- 8. Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_stakes_last_payout_active ON stakes(last_payout) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_earning_history_created_at ON earning_history(created_at);
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at);

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 10. Create a view for monitoring
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  job_name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE error IS NULL) as successful_runs,
  COUNT(*) FILTER (WHERE error IS NOT NULL) as failed_runs,
  MAX(created_at) as last_run,
  MIN(created_at) as first_run
FROM cron_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY job_name
ORDER BY last_run DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Offline earnings system setup completed successfully!';
  RAISE NOTICE 'Cron jobs scheduled:';
  RAISE NOTICE '- daily-rewards-edge-function: Every hour at minute 0';
  RAISE NOTICE '- daily-rewards-direct: Every hour at minute 30 (backup)';
  RAISE NOTICE '- cleanup-cron-logs: Daily at 2 AM';
  RAISE NOTICE 'Monitor with: SELECT * FROM cron_job_status;';
END $$;