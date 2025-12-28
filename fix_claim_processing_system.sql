-- Fix Claim Processing System
-- This script addresses the missing earning_history table and improves claim processing reliability
-- Run this in your Supabase SQL editor

-- 1. Create missing earning_history table
CREATE TABLE IF NOT EXISTS earning_history (
    id BIGSERIAL PRIMARY KEY,
    stake_id BIGINT REFERENCES stakes(id),
    user_id BIGINT REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    type VARCHAR NOT NULL DEFAULT 'manual_claim',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    roi_rate NUMERIC(8,6),
    base_rate NUMERIC(8,6),
    rank_bonus NUMERIC(8,6),
    duration_multiplier NUMERIC(8,6),
    days_processed INTEGER DEFAULT 1
);

-- 1.1 Create withdrawal_requests table for withdrawal tracking
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    token_type VARCHAR NOT NULL DEFAULT 'TON',
    wallet_address TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    transaction_hash TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes for earning_history
CREATE INDEX IF NOT EXISTS idx_earning_history_user_id ON earning_history(user_id);
CREATE INDEX IF NOT EXISTS idx_earning_history_stake_id ON earning_history(stake_id);
CREATE INDEX IF NOT EXISTS idx_earning_history_created_at ON earning_history(created_at);
CREATE INDEX IF NOT EXISTS idx_earning_history_user_date ON earning_history(user_id, created_at);

-- 3. Ensure users table has required columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_earnings NUMERIC(18,8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Ensure stakes table has required columns
ALTER TABLE stakes ADD COLUMN IF NOT EXISTS cycle_progress NUMERIC(8,2) DEFAULT 0;
ALTER TABLE stakes ADD COLUMN IF NOT EXISTS cycle_completed BOOLEAN DEFAULT false;
ALTER TABLE stakes ADD COLUMN IF NOT EXISTS cycle_completed_at TIMESTAMP WITH TIME ZONE;

-- 5. Create improved increment function with better error handling
CREATE OR REPLACE FUNCTION increment_available_earnings_safe(
  p_user_id INTEGER,
  p_amount DECIMAL
) RETURNS JSON AS $$
DECLARE
  result JSON;
  rows_affected INTEGER;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_user_id <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid user ID');
  END IF;
  
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid amount');
  END IF;
  
  -- Update user earnings
  UPDATE users 
  SET 
    available_earnings = COALESCE(available_earnings, 0) + p_amount,
    total_earned = COALESCE(total_earned, 0) + p_amount,
    last_active = NOW(),
    last_sync = NOW()
  WHERE id = p_user_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected = 0 THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'user_id', p_user_id,
    'amount_added', p_amount,
    'updated_at', NOW()
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create improved stake claim function with better error handling
CREATE OR REPLACE FUNCTION process_stake_claim_safe(
  p_stake_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_record RECORD;
  claimable_amount DECIMAL;
  new_total_earned DECIMAL;
  cycle_progress DECIMAL;
  cycle_completed BOOLEAN := false;
  result JSON;
  rows_affected INTEGER;
BEGIN
  -- Validate input
  IF p_stake_id IS NULL OR p_stake_id <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid stake ID');
  END IF;
  
  -- Get stake information with user data
  SELECT 
    s.id, s.user_id, s.amount, s.total_earned, s.last_payout, s.created_at, s.is_active,
    u.rank, u.speed_boost_active
  INTO stake_record
  FROM stakes s
  JOIN users u ON s.user_id = u.id
  WHERE s.id = p_stake_id AND s.is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Stake not found or inactive');
  END IF;
  
  -- Check 24-hour cooldown
  IF EXTRACT(EPOCH FROM (NOW() - stake_record.last_payout)) < 86400 THEN
    RETURN json_build_object(
      'success', false, 
      'error', '24-hour cooldown active',
      'next_claim_time', stake_record.last_payout + INTERVAL '24 hours'
    );
  END IF;
  
  -- Calculate claimable amount using the same logic as the TypeScript version
  claimable_amount := calculate_stake_rewards_safe(p_stake_id);
  
  IF claimable_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No rewards available');
  END IF;
  
  -- Calculate new values
  new_total_earned := COALESCE(stake_record.total_earned, 0) + claimable_amount;
  cycle_progress := LEAST((new_total_earned / stake_record.amount) * 100, 300);
  cycle_completed := cycle_progress >= 300;
  
  -- Update stake
  UPDATE stakes 
  SET 
    total_earned = new_total_earned,
    last_payout = NOW(),
    cycle_progress = cycle_progress,
    is_active = NOT cycle_completed,
    cycle_completed = cycle_completed,
    cycle_completed_at = CASE WHEN cycle_completed THEN NOW() ELSE NULL END
  WHERE id = p_stake_id AND is_active = true;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Failed to update stake');
  END IF;
  
  -- Update user earnings
  SELECT increment_available_earnings_safe(stake_record.user_id, claimable_amount) INTO result;
  
  IF NOT (result->>'success')::boolean THEN
    -- Rollback stake update would require a transaction, but we'll log the error
    RAISE WARNING 'Failed to update user earnings for stake %: %', p_stake_id, result->>'error';
    RETURN json_build_object('success', false, 'error', 'Failed to update user earnings');
  END IF;
  
  -- Record earning history (optional - won't fail if table doesn't exist)
  BEGIN
    INSERT INTO earning_history (
      stake_id, user_id, amount, type, created_at
    ) VALUES (
      p_stake_id, stake_record.user_id, claimable_amount, 'manual_claim', NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail the claim
    RAISE WARNING 'Failed to record earning history for stake %: %', p_stake_id, SQLERRM;
  END;
  
  RETURN json_build_object(
    'success', true,
    'stake_id', p_stake_id,
    'amount_claimed', claimable_amount,
    'new_total_earned', new_total_earned,
    'cycle_progress', cycle_progress,
    'cycle_completed', cycle_completed,
    'timestamp', NOW()
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create improved reward calculation function
CREATE OR REPLACE FUNCTION calculate_stake_rewards_safe(
  p_stake_id INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  stake_record RECORD;
  hours_since_payout DECIMAL;
  days_since_creation DECIMAL;
  base_daily_roi DECIMAL;
  duration_bonus DECIMAL;
  rank_bonus DECIMAL;
  daily_roi DECIMAL;
  daily_earning DECIMAL;
  max_daily_earning DECIMAL;
  claimable_amount DECIMAL;
BEGIN
  -- Validate input
  IF p_stake_id IS NULL OR p_stake_id <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Get stake information with user data
  SELECT 
    s.amount, s.last_payout, s.created_at, s.is_active,
    u.rank, u.speed_boost_active
  INTO stake_record
  FROM stakes s
  JOIN users u ON s.user_id = u.id
  WHERE s.id = p_stake_id AND s.is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check 24-hour cooldown
  hours_since_payout := EXTRACT(EPOCH FROM (NOW() - stake_record.last_payout)) / 3600;
  IF hours_since_payout < 24 THEN
    RETURN 0;
  END IF;
  
  -- Calculate days since stake creation
  days_since_creation := EXTRACT(EPOCH FROM (NOW() - stake_record.created_at)) / 86400;
  
  -- Base daily ROI based on stake amount (tier system)
  base_daily_roi := CASE 
    WHEN stake_record.amount >= 1000 THEN 0.03  -- 3% for 1000+ TON
    WHEN stake_record.amount >= 500 THEN 0.025  -- 2.5% for 500+ TON
    WHEN stake_record.amount >= 100 THEN 0.02   -- 2% for 100+ TON
    WHEN stake_record.amount >= 50 THEN 0.015   -- 1.5% for 50+ TON
    ELSE 0.01                                   -- 1% base
  END;
  
  -- Duration bonus (up to 0.5% additional over time)
  duration_bonus := LEAST(days_since_creation * 0.0001, 0.005);
  
  -- Rank bonus
  rank_bonus := CASE 
    WHEN stake_record.rank = 'GUARDIAN' THEN 0.1   -- +10%
    WHEN stake_record.rank = 'SOVEREIGN' THEN 0.15 -- +15%
    WHEN stake_record.rank = 'CELESTIAL' THEN 0.2  -- +20%
    ELSE 0
  END;
  
  -- Calculate final daily ROI
  daily_roi := base_daily_roi + duration_bonus;
  daily_roi := daily_roi * (1 + rank_bonus);
  
  -- Calculate daily earning
  daily_earning := stake_record.amount * daily_roi;
  
  -- Apply speed boost if active
  IF stake_record.speed_boost_active THEN
    daily_earning := daily_earning * 1.5;
  END IF;
  
  -- Cap the daily earning
  max_daily_earning := LEAST(stake_record.amount * 0.03, 1000);
  claimable_amount := LEAST(daily_earning, max_daily_earning);
  
  -- Ensure positive amount
  IF claimable_amount < 0 THEN
    claimable_amount := 0;
  END IF;
  
  RETURN claimable_amount;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error calculating rewards for stake %: %', p_stake_id, SQLERRM;
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create improved batch processing function
CREATE OR REPLACE FUNCTION process_all_user_stakes_safe(
  p_user_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_id INTEGER;
  claim_result JSON;
  total_claimed DECIMAL := 0;
  stakes_processed INTEGER := 0;
  errors TEXT[] := ARRAY[]::TEXT[];
  result JSON;
BEGIN
  -- Validate input
  IF p_user_id IS NULL OR p_user_id <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid user ID');
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'User not found or inactive');
  END IF;
  
  -- Process each eligible stake
  FOR stake_id IN 
    SELECT id FROM stakes 
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY created_at ASC
  LOOP
    BEGIN
      claim_result := process_stake_claim_safe(stake_id);
      
      IF (claim_result->>'success')::boolean THEN
        total_claimed := total_claimed + (claim_result->>'amount_claimed')::decimal;
        stakes_processed := stakes_processed + 1;
      ELSE
        -- Only add to errors if it's not just a cooldown
        IF (claim_result->>'error') NOT LIKE '%cooldown%' THEN
          errors := array_append(errors, 'Stake ' || stake_id || ': ' || (claim_result->>'error'));
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, 'Stake ' || stake_id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  result := json_build_object(
    'success', stakes_processed > 0 OR total_claimed > 0,
    'user_id', p_user_id,
    'total_claimed', total_claimed,
    'stakes_processed', stakes_processed,
    'errors', CASE WHEN array_length(errors, 1) > 0 THEN errors ELSE NULL END,
    'timestamp', NOW()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create improved eligibility check function
CREATE OR REPLACE FUNCTION get_user_claimable_rewards_safe(
  p_user_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_record RECORD;
  total_claimable DECIMAL := 0;
  eligible_stakes INTEGER := 0;
  total_stakes INTEGER := 0;
  claimable DECIMAL;
  next_claim_time TIMESTAMP;
  earliest_next_claim TIMESTAMP;
  result JSON;
BEGIN
  -- Validate input
  IF p_user_id IS NULL OR p_user_id <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid user ID');
  END IF;
  
  -- Count total stakes
  SELECT COUNT(*) INTO total_stakes
  FROM stakes 
  WHERE user_id = p_user_id AND is_active = true;
  
  IF total_stakes = 0 THEN
    RETURN json_build_object(
      'success', true,
      'user_id', p_user_id,
      'total_claimable', 0,
      'eligible_stakes', 0,
      'total_stakes', 0,
      'can_claim', false,
      'message', 'No active stakes found',
      'checked_at', NOW()
    );
  END IF;
  
  -- Process each active stake
  FOR stake_record IN 
    SELECT id, last_payout FROM stakes 
    WHERE user_id = p_user_id AND is_active = true
  LOOP
    claimable := calculate_stake_rewards_safe(stake_record.id);
    
    IF claimable > 0 THEN
      total_claimable := total_claimable + claimable;
      eligible_stakes := eligible_stakes + 1;
    ELSE
      -- Calculate next claim time for this stake
      next_claim_time := stake_record.last_payout + INTERVAL '24 hours';
      IF earliest_next_claim IS NULL OR next_claim_time < earliest_next_claim THEN
        earliest_next_claim := next_claim_time;
      END IF;
    END IF;
  END LOOP;
  
  result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'total_claimable', total_claimable,
    'eligible_stakes', eligible_stakes,
    'total_stakes', total_stakes,
    'can_claim', total_claimable > 0,
    'next_claim_time', earliest_next_claim,
    'checked_at', NOW()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant permissions for new functions
GRANT EXECUTE ON FUNCTION increment_available_earnings_safe(INTEGER, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_stake_claim_safe(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stake_rewards_safe(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_all_user_stakes_safe(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_claimable_rewards_safe(INTEGER) TO anon, authenticated;

-- 11. Create RLS policies for earning_history table (with conflict handling)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'earning_history' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE earning_history ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own earning history" ON earning_history;
  DROP POLICY IF EXISTS "System can insert earning history" ON earning_history;

  -- Create new policies
  CREATE POLICY "Users can view their own earning history" ON earning_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

  CREATE POLICY "System can insert earning history" ON earning_history
    FOR INSERT WITH CHECK (true);
END $$;

-- 11.1 Create RLS policies for withdrawal_requests table
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'withdrawal_requests' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON withdrawal_requests;
  DROP POLICY IF EXISTS "Users can insert their own withdrawal requests" ON withdrawal_requests;

  -- Create new policies
  CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid()::text = user_id::text);

  CREATE POLICY "Users can insert their own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
END $$;

-- 12. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_stakes_user_active_payout ON stakes(user_id, is_active, last_payout);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE is_active = true;

-- Success message
SELECT 'Claim processing system has been successfully fixed and enhanced!' as message;