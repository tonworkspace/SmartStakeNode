-- Fix increment_sbt function - Remove reference to non-existent sbt_last_updated column
-- This fixes the error: column "sbt_last_updated" of relation "users" does not exist

-- Create or replace the increment_sbt function without the problematic column
CREATE OR REPLACE FUNCTION increment_sbt(
  user_id INTEGER,
  amount DECIMAL
) RETURNS VOID AS $$
BEGIN
  -- Update only the total_sbt column (remove sbt_last_updated reference)
  UPDATE users 
  SET total_sbt = COALESCE(total_sbt, 0) + amount
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found with id: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure total_sbt column exists and has proper defaults
DO $$
BEGIN
    -- Add total_sbt column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_sbt'
    ) THEN
        ALTER TABLE users ADD COLUMN total_sbt NUMERIC(18,8) DEFAULT 0;
        RAISE NOTICE 'Added total_sbt column to users table';
    END IF;
    
    -- Update any NULL values to 0
    UPDATE users SET total_sbt = 0 WHERE total_sbt IS NULL;
    
    RAISE NOTICE 'increment_sbt function updated successfully';
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_sbt(INTEGER, DECIMAL) TO anon, authenticated;

-- Test the function (optional - comment out if not needed)
-- SELECT increment_sbt(1, 10.5); -- This should work without errors