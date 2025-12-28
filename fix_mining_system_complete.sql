-- Complete Mining System Fix
-- This script addresses all issues preventing the mining system from working

-- 1. Ensure all required database functions exist
CREATE OR REPLACE FUNCTION increment_available_earnings(
  user_id INTEGER,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    available_earnings = COALESCE(available_earnings, 0) + amount,
    total_earned = COALESCE(total_earned, 0) + amount,
    last_active = NOW()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with id: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_sbt(
  user_id INTEGER,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    total_sbt = COALESCE(total_sbt, 0) + amount,
    sbt_last_updated = NOW()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with id: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enhanced stake reward calculation function
CREATE OR REPLACE FUNCTION calculate_stake_rewards(
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
  -- Get stake and user information
  SELECT s.*, u.rank, u.speed_boost_active
  INTO stake_record
  FROM stakes s
  JOIN users u ON s.user_id = u.id
  WHERE s.id = p_stake_id AND s.is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate time since last payout
  hours_since_payout := EXTRACT(EPOCH FROM (NOW() - stake_record.last_payout)) / 3600;
  
  -- Must wait at least 24 hours between claims
  IF hours_since_payout < 24 THEN
    RETURN 0;
  END IF;
  
  -- Calculate days since stake creation
  days_since_creation := EXTRACT(EPOCH FROM (NOW() - stake_record.created_at)) / 86400;
  
  -- Base daily ROI based on stake amount
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
  
  RETURN claimable_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Process stake claim function
CREATE OR REPLACE FUNCTION process_stake_claim(
  p_stake_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_record RECORD;
  claimable_amount DECIMAL;
  new_total_earned DECIMAL;
  cycle_progress DECIMAL;
  result JSON;
BEGIN
  -- Get stake information
  SELECT * INTO stake_record FROM stakes WHERE id = p_stake_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Stake not found or inactive');
  END IF;
  
  -- Calculate claimable amount
  claimable_amount := calculate_stake_rewards(p_stake_id);
  
  IF claimable_amount <= 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No rewards available or 24-hour cooldown active'
    );
  END IF;
  
  -- Update stake
  new_total_earned := stake_record.total_earned + claimable_amount;
  cycle_progress := LEAST((new_total_earned / stake_record.amount) * 100, 300);
  
  UPDATE stakes 
  SET 
    total_earned = new_total_earned,
    last_payout = NOW(),
    cycle_progress = cycle_progress
  WHERE id = p_stake_id;
  
  -- Update user earnings
  PERFORM increment_available_earnings(stake_record.user_id, claimable_amount);
  
  -- Record earning history
  INSERT INTO earning_history (
    stake_id, user_id, amount, type, created_at,
    roi_rate, base_rate
  ) VALUES (
    p_stake_id, stake_record.user_id, claimable_amount, 'manual_claim', NOW(),
    (SELECT daily_rate FROM stakes WHERE id = p_stake_id) * 100,
    1.0
  );
  
  -- Check for cycle completion
  IF cycle_progress >= 300 THEN
    UPDATE stakes 
    SET 
      is_active = false,
      cycle_completed = true,
      cycle_completed_at = NOW()
    WHERE id = p_stake_id;
    
    -- Process cycle completion rewards (20% reinvestment)
    PERFORM increment_balance(stake_record.user_id, stake_record.amount * 0.2);
  END IF;
  
  result := json_build_object(
    'success', true,
    'amount_claimed', claimable_amount,
    'new_total_earned', new_total_earned,
    'cycle_progress', cycle_progress,
    'cycle_completed', cycle_progress >= 300
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get user claimable rewards function
CREATE OR REPLACE FUNCTION get_user_claimable_rewards(
  p_user_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_record RECORD;
  total_claimable DECIMAL := 0;
  eligible_stakes INTEGER := 0;
  total_stakes INTEGER := 0;
  next_claim_time TIMESTAMP;
  earliest_next_claim TIMESTAMP;
  result JSON;
BEGIN
  -- Process each active stake
  FOR stake_record IN 
    SELECT * FROM stakes WHERE user_id = p_user_id AND is_active = true
  LOOP
    total_stakes := total_stakes + 1;
    
    DECLARE
      claimable DECIMAL;
      hours_since_payout DECIMAL;
    BEGIN
      claimable := calculate_stake_rewards(stake_record.id);
      hours_since_payout := EXTRACT(EPOCH FROM (NOW() - stake_record.last_payout)) / 3600;
      
      IF claimable > 0 THEN
        total_claimable := total_claimable + claimable;
        eligible_stakes := eligible_stakes + 1;
      ELSE
        -- Calculate when this stake becomes claimable
        next_claim_time := stake_record.last_payout + INTERVAL '24 hours';
        IF earliest_next_claim IS NULL OR next_claim_time < earliest_next_claim THEN
          earliest_next_claim := next_claim_time;
        END IF;
      END IF;
    END;
  END LOOP;
  
  result := json_build_object(
    'user_id', p_user_id,
    'total_claimable', total_claimable,
    'eligible_stakes', eligible_stakes,
    'total_stakes', total_stakes,
    'can_claim', total_claimable > 0,
    'next_claim_time', earliest_next_claim,
    'checked_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Automated reward processing function (for cron jobs)
CREATE OR REPLACE FUNCTION process_automated_rewards()
RETURNS JSON AS $$
DECLARE
  stake_record RECORD;
  total_processed INTEGER := 0;
  total_earnings DECIMAL := 0;
  errors TEXT[] := ARRAY[]::TEXT[];
  result JSON;
BEGIN
  -- Process all eligible stakes (24+ hours since last payout)
  FOR stake_record IN 
    SELECT s.*, u.rank, u.speed_boost_active
    FROM stakes s 
    JOIN users u ON s.user_id = u.id
    WHERE s.is_active = true
    AND s.last_payout < NOW() - INTERVAL '24 hours'
  LOOP
    BEGIN
      DECLARE
        claim_result JSON;
      BEGIN
        claim_result := process_stake_claim(stake_record.id);
        
        IF (claim_result->>'success')::boolean THEN
          total_processed := total_processed + 1;
          total_earnings := total_earnings + (claim_result->>'amount_claimed')::decimal;
        ELSE
          errors := array_append(errors, 'Stake ' || stake_record.id || ': ' || (claim_result->>'error'));
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, 'Stake ' || stake_record.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  result := json_build_object(
    'success', true,
    'total_processed', total_processed,
    'total_earnings', total_earnings,
    'errors', CASE WHEN array_length(errors, 1) > 0 THEN errors ELSE NULL END,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stakes_user_active ON stakes(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stakes_last_payout ON stakes(last_payout) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_available_earnings ON users(available_earnings);
CREATE INDEX IF NOT EXISTS idx_earning_history_user_date ON earning_history(user_id, created_at);

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION increment_available_earnings(INTEGER, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_sbt(INTEGER, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stake_rewards(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_stake_claim(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_claimable_rewards(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_automated_rewards() TO service_role;

-- Success message
SELECT 'Mining system database functions created successfully!' as status;