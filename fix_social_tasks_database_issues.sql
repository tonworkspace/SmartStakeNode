-- Fix Social Tasks Database Issues
-- This migration adds missing RPC functions and ensures proper schema

-- Add metadata column to activities table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE activities ADD COLUMN metadata JSONB;
        CREATE INDEX IF NOT EXISTS idx_activities_metadata ON activities USING GIN (metadata);
        RAISE NOTICE 'Added metadata column to activities table';
    ELSE
        RAISE NOTICE 'Metadata column already exists in activities table';
    END IF;
END $$;

-- Create increment_sbt function if it doesn't exist
CREATE OR REPLACE FUNCTION increment_sbt(user_id INTEGER, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET total_sbt = COALESCE(total_sbt, 0) + amount
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with id % not found', user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create increment_user_balance function if it doesn't exist (for fallback)
CREATE OR REPLACE FUNCTION increment_user_balance(user_id INTEGER, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET balance = COALESCE(balance, 0) + amount
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with id % not found', user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure total_sbt column exists in users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_sbt'
    ) THEN
        ALTER TABLE users ADD COLUMN total_sbt NUMERIC DEFAULT 0;
        RAISE NOTICE 'Added total_sbt column to users table';
    ELSE
        RAISE NOTICE 'total_sbt column already exists in users table';
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_sbt(INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_balance(INTEGER, NUMERIC) TO authenticated;

-- Update any NULL total_sbt values to 0
UPDATE users SET total_sbt = 0 WHERE total_sbt IS NULL;