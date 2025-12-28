-- Create the missing update_user_deposit RPC function
-- This function is called when a deposit is confirmed to update the user's balance

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
    
    -- Update or create user_earnings record
    INSERT INTO user_earnings (user_id, last_update, created_at, updated_at)
    VALUES (p_user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
        
    -- Log the deposit for tracking
    INSERT INTO earning_logs (user_id, type, amount, metadata, timestamp)
    VALUES (p_user_id, 'deposit', p_amount, 
            json_build_object('deposit_id', p_deposit_id, 'source', 'update_user_deposit'),
            CURRENT_TIMESTAMP);
            
END;
$ LANGUAGE plpgsql;

-- Also create the update_user_restake function that's referenced in the code
CREATE OR REPLACE FUNCTION update_user_restake(
    p_user_id INTEGER,
    p_amount NUMERIC(18,8),
    p_deposit_date TIMESTAMP WITH TIME ZONE
)
RETURNS void
SECURITY INVOKER
AS $
BEGIN
    -- Update user balance for restaking
    UPDATE users 
    SET 
        balance = p_amount,
        last_deposit_date = p_deposit_date,
        last_deposit_time = p_deposit_date
    WHERE id = p_user_id;
    
    -- Reset current earnings since they were restaked
    UPDATE user_earnings
    SET 
        current_earnings = 0,
        last_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    -- Log the restake activity
    INSERT INTO earning_logs (user_id, type, amount, metadata, timestamp)
    VALUES (p_user_id, 'restake', p_amount, 
            json_build_object('source', 'update_user_restake'),
            CURRENT_TIMESTAMP);
            
END;
$ LANGUAGE plpgsql;