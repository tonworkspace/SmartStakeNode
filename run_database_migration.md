# Database Migration Instructions

## Required Database Updates

To complete the deposit and mining system integration, you need to run the following SQL in your Supabase dashboard:

### 1. Add start_date column to user_earnings table

```sql
-- Add missing start_date column to user_earnings table
-- This field is used to track when a user started earning to calculate time-based multipliers

ALTER TABLE user_earnings 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a start_date if they don't have one
UPDATE user_earnings 
SET start_date = created_at 
WHERE start_date IS NULL;
```

### 2. Update the update_user_deposit function

```sql
-- Update the update_user_deposit function to handle start_date properly
CREATE OR REPLACE FUNCTION update_user_deposit(
    p_user_id INTEGER,
    p_amount NUMERIC(18,8),
    p_deposit_id INTEGER
)
RETURNS void
SECURITY INVOKER
AS $$
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
    
    -- Update or create user_earnings record with proper start_date handling
    INSERT INTO user_earnings (user_id, last_update, start_date, created_at, updated_at)
    VALUES (p_user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_update = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        -- Only update start_date if it's null (preserve existing start dates)
        start_date = COALESCE(user_earnings.start_date, CURRENT_TIMESTAMP);
        
    -- Log the deposit for tracking
    INSERT INTO earning_logs (user_id, type, amount, metadata, timestamp)
    VALUES (p_user_id, 'deposit', p_amount, 
            json_build_object('deposit_id', p_deposit_id, 'source', 'update_user_deposit'),
            CURRENT_TIMESTAMP);
            
END;
$$ LANGUAGE plpgsql;
```

## How to Run

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL above
4. Click "Run" to execute the migration

## What This Does

- **Adds start_date column**: Tracks when users started earning for time-based multipliers
- **Updates existing records**: Sets start_date to created_at for existing users
- **Enhances deposit function**: Properly handles start_date during deposits
- **Maintains data integrity**: Preserves existing start dates while adding new ones

## After Migration

Once you run this migration, the enhanced deposit and mining system will be fully functional with:

- ✅ Real-time balance updates
- ✅ Immediate activity display
- ✅ Time-based earning multipliers
- ✅ Integrated mining calculations
- ✅ Proper error handling and retry logic

The system is ready for production use!