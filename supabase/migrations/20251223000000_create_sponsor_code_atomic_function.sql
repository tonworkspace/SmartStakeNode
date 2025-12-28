-- Create atomic function for sponsor code application
-- This ensures all operations succeed or fail together

CREATE OR REPLACE FUNCTION apply_sponsor_code_atomic(
  p_sponsor_id INTEGER,
  p_referred_id INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_sponsor_username TEXT;
  v_current_referrals INTEGER;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Check if referral already exists
  IF EXISTS (
    SELECT 1 FROM referrals 
    WHERE referred_id = p_referred_id
  ) THEN
    RAISE EXCEPTION 'User already has a sponsor' USING ERRCODE = '23505';
  END IF;
  
  -- Get sponsor info
  SELECT username, COALESCE(direct_referrals, 0)
  INTO v_sponsor_username, v_current_referrals
  FROM users 
  WHERE id = p_sponsor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsor not found' USING ERRCODE = '23503';
  END IF;
  
  -- Insert referral relationship
  INSERT INTO referrals (sponsor_id, referred_id, status, created_at)
  VALUES (p_sponsor_id, p_referred_id, 'active', NOW());
  
  -- Update user's sponsor_id
  UPDATE users 
  SET sponsor_id = p_sponsor_id
  WHERE id = p_referred_id;
  
  -- Update sponsor's referral count
  UPDATE users 
  SET direct_referrals = v_current_referrals + 1
  WHERE id = p_sponsor_id;
  
  -- Return success result
  v_result := json_build_object(
    'success', true,
    'sponsor_id', p_sponsor_id,
    'referred_id', p_referred_id,
    'sponsor_username', v_sponsor_username
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to trigger rollback
    RAISE;
END;
$$;