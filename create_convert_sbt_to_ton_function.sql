-- Create function to convert SBT to TON
CREATE OR REPLACE FUNCTION convert_sbt_to_ton(
  user_id INTEGER,
  sbt_amount DECIMAL,
  ton_amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  -- Check if user has enough SBT balance
  IF (SELECT COALESCE(total_sbt, 0) FROM users WHERE id = user_id) < sbt_amount THEN
    RAISE EXCEPTION 'Insufficient SBT balance';
  END IF;
  
  -- Update user balances
  UPDATE users 
  SET 
    total_sbt = COALESCE(total_sbt, 0) - sbt_amount,
    balance = COALESCE(balance, 0) + ton_amount
  WHERE id = user_id;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment available earnings for a user
CREATE OR REPLACE FUNCTION increment_available_earnings(
  user_id INTEGER,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    available_earnings = COALESCE(available_earnings, 0) + amount,
    total_earned = COALESCE(total_earned, 0) + amount
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment SBT balance
CREATE OR REPLACE FUNCTION increment_sbt(
  user_id INTEGER,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    total_sbt = COALESCE(total_sbt, 0) + amount
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment balance
CREATE OR REPLACE FUNCTION increment_balance(
  user_id INTEGER,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    balance = COALESCE(balance, 0) + amount
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql;