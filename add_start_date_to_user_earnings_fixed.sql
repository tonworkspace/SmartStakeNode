-- Add missing start_date column to user_earnings table
-- This column is needed for the enhanced deposit sync system

-- Add the start_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_earnings' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE user_earnings 
        ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing records to have a start_date
        UPDATE user_earnings 
        SET start_date = COALESCE(created_at, CURRENT_TIMESTAMP)
        WHERE start_date IS NULL;
        
        RAISE NOTICE 'Added start_date column to user_earnings table';
    ELSE
        RAISE NOTICE 'start_date column already exists in user_earnings table';
    END IF;
END $$;

-- Ensure the update_user_deposit function is properly created
CREATE OR REPLACE FUNCTION update_user_deposit(
    p_user_id INTEGER,
    p_amount NUMERIC(18,8),
    p_deposit_id INTEGER
)
RETURNS void
SECURITY INVOKER
AS $
BEGIN
    -- Update user balance and related fields
    UPDATE users 
    SET 
        balance = COALESCE(balance, 0) + p_amount,
        total_deposit = COALESCE(total_deposit, 0) + p_amount,
        current_deposit = COALESCE(current_deposit, 0) + p_amount,
        last_deposit_date = CURRENT_TIMESTAMP,
        last_deposit_time = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    -- Create activity record for the deposit
    INSERT INTO activities (user_id, type, amount, status, deposit_id, created_at)
    VALUES (p_user_id, 'deposit', p_amount, 'completed', p_deposit_id, CURRENT_TIMESTAMP);
    
    -- Update or create user_earnings record with start_date
    INSERT INTO user_earnings (user_id, last_update, start_date, created_at, updated_at)
    VALUES (p_user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        start_date = COALESCE(user_earnings.start_date, CURRENT_TIMESTAMP);
        
    -- Log the deposit for tracking
    INSERT INTO earning_logs (user_id, type, amount, metadata, timestamp)
    VALUES (p_user_id, 'deposit', p_amount, 
            json_build_object('deposit_id', p_deposit_id, 'source', 'update_user_deposit'),
            CURRENT_TIMESTAMP);
            
    RAISE NOTICE 'Successfully processed deposit of % for user %', p_amount, p_user_id;
END;
$ LANGUAGE plpgsql;

-- Test the function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_user_deposit'
    ) THEN
        RAISE NOTICE 'update_user_deposit function is available';
    ELSE
        RAISE WARNING 'update_user_deposit function was not created properly';
    END IF;
END $$;