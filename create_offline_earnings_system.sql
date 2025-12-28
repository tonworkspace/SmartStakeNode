-- Create function to calculate offline earnings for a user
CREATE OR REPLACE FUNCTION calculate_offline_earnings(p_user_id INTEGER)
RETURNS TABLE (
  stake_id INTEGER,
  offline_earnings DECIMAL,
  days_offline INTEGER,
  last_calculated TIMESTAMP
) AS $$
DECLARE
  stake_record RECORD;
  days_since_last_payout INTEGER;
  daily_roi DECIMAL;
  base_daily_roi DECIMAL;
  duration_bonus DECIMAL;
  rank_bonus DECIMAL;
  daily_earning DECIMAL;
  max_daily_earning DECIMAL;
  total_offline_earning DECIMAL;
  user_rank TEXT;
  speed_boost_active BOOLEAN;
BEGIN
  -- Get user info
  SELECT rank, speed_boost_active INTO user_rank, speed_boost_active
  FROM users WHERE id = p_user_id;
  
  -- Calculate rank bonus
  rank_bonus := CASE 
    WHEN user_rank = 'GUARDIAN' THEN 0.1
    WHEN user_rank = 'SOVEREIGN' THEN 0.15
    WHEN user_rank = 'CELESTIAL' THEN 0.2
    ELSE 0
  END;
  
  -- Process each active stake
  FOR stake_record IN 
    SELECT s.*, 
           EXTRACT(EPOCH FROM (NOW() - s.last_payout)) / 86400 as days_since_payout,
           EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400 as days_since_creation
    FROM stakes s 
    WHERE s.user_id = p_user_id 
    AND s.is_active = true
    AND s.last_payout < NOW() - INTERVAL '24 hours'
  LOOP
    -- Calculate base daily ROI based on stake amount
    base_daily_roi := CASE 
      WHEN stake_record.amount >= 1000 THEN 0.03
      WHEN stake_record.amount >= 500 THEN 0.025
      WHEN stake_record.amount >= 100 THEN 0.02
      WHEN stake_record.amount >= 50 THEN 0.015
      ELSE 0.01
    END;
    
    -- Duration bonus (up to 0.5% additional)
    duration_bonus := LEAST(stake_record.days_since_creation * 0.0001, 0.005);
    
    -- Calculate final daily ROI
    daily_roi := base_daily_roi + duration_bonus;
    daily_roi := daily_roi * (1 + rank_bonus);
    
    -- Calculate daily earning
    daily_earning := stake_record.amount * daily_roi;
    
    -- Apply speed boost if active
    IF speed_boost_active THEN
      daily_earning := daily_earning * 1.5;
    END IF;
    
    -- Cap the daily earning
    max_daily_earning := LEAST(stake_record.amount * 0.03, 1000);
    daily_earning := LEAST(daily_earning, max_daily_earning);
    
    -- Calculate offline days (max 7 days)
    days_since_last_payout := FLOOR(stake_record.days_since_payout);
    days_since_last_payout := LEAST(days_since_last_payout, 7);
    
    -- Calculate total offline earnings
    total_offline_earning := daily_earning * days_since_last_payout;
    
    -- Return the result
    stake_id := stake_record.id;
    offline_earnings := total_offline_earning;
    days_offline := days_since_last_payout;
    last_calculated := NOW();
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process offline earnings and update database
CREATE OR REPLACE FUNCTION process_offline_earnings(p_user_id INTEGER)
RETURNS JSON AS $$
DECLARE
  earning_record RECORD;
  total_processed DECIMAL := 0;
  stakes_processed INTEGER := 0;
  result JSON;
BEGIN
  -- Process each offline earning
  FOR earning_record IN 
    SELECT * FROM calculate_offline_earnings(p_user_id)
    WHERE offline_earnings > 0
  LOOP
    -- Update stake
    UPDATE stakes 
    SET 
      total_earned = total_earned + earning_record.offline_earnings,
      last_payout = NOW(),
      cycle_progress = LEAST(((total_earned + earning_record.offline_earnings) / amount) * 100, 300)
    WHERE id = earning_record.stake_id;
    
    -- Update user earnings
    UPDATE users 
    SET 
      available_earnings = COALESCE(available_earnings, 0) + earning_record.offline_earnings,
      total_earned = COALESCE(total_earned, 0) + earning_record.offline_earnings,
      last_active = NOW()
    WHERE id = p_user_id;
    
    -- Record earning history
    INSERT INTO earning_history (
      stake_id, user_id, amount, type, created_at,
      roi_rate, days_processed
    ) VALUES (
      earning_record.stake_id, p_user_id, earning_record.offline_earnings, 
      'offline_earnings', NOW(),
      (SELECT daily_rate FROM stakes WHERE id = earning_record.stake_id) * 100,
      earning_record.days_offline
    );
    
    total_processed := total_processed + earning_record.offline_earnings;
    stakes_processed := stakes_processed + 1;
  END LOOP;
  
  -- Build result JSON
  result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'total_earnings', total_processed,
    'stakes_processed', stakes_processed,
    'processed_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's offline earnings summary (without processing)
CREATE OR REPLACE FUNCTION get_offline_earnings_summary(p_user_id INTEGER)
RETURNS JSON AS $$
DECLARE
  earning_record RECORD;
  total_pending DECIMAL := 0;
  stakes_with_earnings INTEGER := 0;
  max_days_offline INTEGER := 0;
  result JSON;
BEGIN
  -- Calculate pending offline earnings
  FOR earning_record IN 
    SELECT * FROM calculate_offline_earnings(p_user_id)
  LOOP
    IF earning_record.offline_earnings > 0 THEN
      total_pending := total_pending + earning_record.offline_earnings;
      stakes_with_earnings := stakes_with_earnings + 1;
      max_days_offline := GREATEST(max_days_offline, earning_record.days_offline);
    END IF;
  END LOOP;
  
  -- Build result JSON
  result := json_build_object(
    'user_id', p_user_id,
    'total_pending_earnings', total_pending,
    'stakes_with_earnings', stakes_with_earnings,
    'max_days_offline', max_days_offline,
    'can_claim_offline', total_pending > 0,
    'checked_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically process offline earnings when user becomes active
CREATE OR REPLACE FUNCTION auto_process_offline_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was offline for more than 1 hour, process offline earnings
  IF OLD.last_active IS NULL OR 
     NEW.last_active > OLD.last_active + INTERVAL '1 hour' THEN
    
    -- Process offline earnings in background
    PERFORM process_offline_earnings(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_auto_process_offline_earnings ON users;
CREATE TRIGGER trigger_auto_process_offline_earnings
  AFTER UPDATE OF last_active ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_process_offline_earnings();

-- Add last_active column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();

-- Add days_processed column to earning_history if it doesn't exist
ALTER TABLE earning_history ADD COLUMN IF NOT EXISTS days_processed INTEGER DEFAULT 1;