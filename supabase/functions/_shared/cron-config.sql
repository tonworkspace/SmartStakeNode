-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron to the service role
GRANT USAGE ON SCHEMA cron TO service_role;

-- Create a function to call our Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_rewards_processing()
RETURNS void AS $$
DECLARE
  response TEXT;
BEGIN
  -- Call the Edge Function via HTTP
  SELECT content INTO response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/process-daily-rewards',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log the response
  INSERT INTO cron_logs (job_name, response, created_at)
  VALUES ('daily_rewards_processing', response, NOW());
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO cron_logs (job_name, response, error, created_at)
  VALUES ('daily_rewards_processing', NULL, SQLERRM, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to log cron job results
CREATE TABLE IF NOT EXISTS cron_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  response TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedule the daily rewards processing to run every hour
SELECT cron.schedule(
  'daily-rewards-processing',
  '0 * * * *', -- Every hour at minute 0
  'SELECT trigger_daily_rewards_processing();'
);

-- Schedule a cleanup job to remove old logs (keep last 7 days)
SELECT cron.schedule(
  'cleanup-cron-logs',
  '0 2 * * *', -- Daily at 2 AM
  'DELETE FROM cron_logs WHERE created_at < NOW() - INTERVAL ''7 days'';'
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_stakes_last_payout ON stakes(last_payout) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);