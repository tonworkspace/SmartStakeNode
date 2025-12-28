-- Simplified Mining System Fix
-- This script fixes the SQL syntax issues and provides core mining functions

-- 1. Basic increment functions
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

-- 2. Calculate stake rewards (simplified)
CREATE OR REPLACE FUNCTION calculate_stake_rewards(
  p_stake_id INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  stake_amount DECIMAL;
  stake_last_payout TIMESTAMP;
  stake_created_at TIMESTAMP;
  user_rank TEXT;
  user_speed_boost BOOLEAN;
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
  -- Get stake information
  SELECT amount, last_payout, created_at
  INTO stake_amount, stake_last_payout, stake_created_at
  FROM stakes 
  WHERE id = p_stake_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get user information
  SELECT u.rank, u.speed_boost_active
  INTO user_rank, user_speed_boost
  FROM users u
  JOIN stakes s ON u.id = s.user_id
  WHERE s.id = p_stake_id;
  
  -- Calculate time since last payout
  hours_since_payout := EXTRACT(EPOCH FROM (NOW() - stake_last_payout)) / 3600;
  
  -- Must wait at least 24 hours between claims
  IF hours_since_payout < 24 THEN
    RETURN 0;
  END IF;
  
  -- Calculate days since stake creation
  days_since_creation := EXTRACT(EPOCH FROM (NOW() - stake_created_at)) / 86400;
  
  -- Base daily ROI based on stake amount
  base_daily_roi := CASE 
    WHEN stake_amount >= 1000 THEN 0.03  -- 3% for 1000+ TON
    WHEN stake_amount >= 500 THEN 0.025  -- 2.5% for 500+ TON
    WHEN stake_amount >= 100 THEN 0.02   -- 2% for 100+ TON
    WHEN stake_amount >= 50 THEN 0.015   -- 1.5% for 50+ TON
    ELSE 0.01                            -- 1% base
  END;
  
  -- Duration bonus (up to 0.5% additional over time)
  duration_bonus := LEAST(days_since_creation * 0.0001, 0.005);
  
  -- Rank bonus
  rank_bonus := CASE 
    WHEN user_rank = 'GUARDIAN' THEN 0.1   -- +10%
    WHEN user_rank = 'SOVEREIGN' THEN 0.15 -- +15%
    WHEN user_rank = 'CELESTIAL' THEN 0.2  -- +20%
    ELSE 0
  END;
  
  -- Calculate final daily ROI
  daily_roi := base_daily_roi + duration_bonus;
  daily_roi := daily_roi * (1 + rank_bonus);
  
  -- Calculate daily earning
  daily_earning := stake_amount * daily_roi;
  
  -- Apply speed boost if active
  IF user_speed_boost THEN
    daily_earning := daily_earning * 1.5;
  END IF;
  
  -- Cap the daily earning
  max_daily_earning := LEAST(stake_amount * 0.03, 1000);
  claimable_amount := LEAST(daily_earning, max_daily_earning);
  
  RETURN claimable_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Process stake claim
CREATE OR REPLACE FUNCTION process_stake_claim(
  p_stake_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_user_id INTEGER;
  stake_amount DECIMAL;
  stake_total_earned DECIMAL;
  claimable_amount DECIMAL;
  new_total_earned DECIMAL;
  cycle_progress DECIMAL;
  result JSON;
BEGIN
  -- Get stake information
  SELECT user_id, amount, total_earned
  INTO stake_user_id, stake_amount, stake_total_earned
  FROM stakes 
  WHERE id = p_stake_id AND is_active = true;
  
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
  new_total_earned := stake_total_earned + claimable_amount;
  cycle_progress := LEAST((new_total_earned / stake_amount) * 100, 300);
  
  UPDATE stakes 
  SET 
    total_earned = new_total_earned,
    last_payout = NOW(),
    cycle_progress = cycle_progress
  WHERE id = p_stake_id;
  
  -- Update user earnings
  PERFORM increment_available_earnings(stake_user_id, claimable_amount);
  
  -- Record earning history
  INSERT INTO earning_history (
    stake_id, user_id, amount, type, created_at
  ) VALUES (
    p_stake_id, stake_user_id, claimable_amount, 'manual_claim', NOW()
  );
  
  -- Check for cycle completion
  IF cycle_progress >= 300 THEN
    UPDATE stakes 
    SET 
      is_active = false,
      cycle_completed = true,
      cycle_completed_at = NOW()
    WHERE id = p_stake_id;
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

-- 4. Get user claimable rewards
CREATE OR REPLACE FUNCTION get_user_claimable_rewards(
  p_user_id INTEGER
) RETURNS JSON AS $$
DECLARE
  stake_id INTEGER;
  total_claimable DECIMAL := 0;
  eligible_stakes INTEGER := 0;
  total_stakes INTEGER := 0;
  claimable DECIMAL;
  result JSON;
BEGIN
  -- Count total stakes
  SELECT COUNT(*) INTO total_stakes
  FROM stakes 
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Process each active stake
  FOR stake_id IN 
    SELECT id FROM stakes WHERE user_id = p_user_id AND is_active = true
  LOOP
    claimable := calculate_stake_rewards(stake_id);
    
    IF claimable > 0 THEN
      total_claimable := total_claimable + claimable;
      eligible_stakes := eligible_stakes + 1;
    END IF;
  END LOOP;
  
  result := json_build_object(
    'user_id', p_user_id,
    'total_claimable', total_claimable,
    'eligible_stakes', eligible_stakes,
    'total_stakes', total_stakes,
    'can_claim', total_claimable > 0,
    'checked_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Process all user stakes (for batch claiming)
CREATE OR REPLACE FUNCTION process_all_user_stakes(
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
  -- Process each eligible stake
  FOR stake_id IN 
    SELECT id FROM stakes 
    WHERE user_id = p_user_id AND is_active = true
  LOOP
    BEGIN
      claim_result := process_stake_claim(stake_id);
      
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
    'success', true,
    'user_id', p_user_id,
    'total_claimed', total_claimed,
    'stakes_processed', stakes_processed,
    'errors', CASE WHEN array_length(errors, 1) > 0 THEN errors ELSE NULL END,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_stakes_user_active ON stakes(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stakes_last_payout ON stakes(last_payout) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_available_earnings ON users(available_earnings);

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION increment_available_earnings(INTEGER, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_sbt(INTEGER, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stake_rewards(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_stake_claim(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_claimable_rewards(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_all_user_stakes(INTEGER) TO anon, authenticated;

-- Success message
SELECT 'Mining system functions created successfully!' as status;