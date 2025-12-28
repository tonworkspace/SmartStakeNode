# Social Tasks Database Fix

## Issues Fixed

1. **Missing `metadata` column in `activities` table** - causing PGRST204 error
2. **Missing `increment_sbt` RPC function** - needed for SBT balance updates
3. **SBT balance not updating properly** - fixed balance update logic

## Database Migration

Run the following SQL migration in your Supabase SQL editor:

```sql
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
```

## Code Changes Made

### 1. SocialTasks.tsx
- Added `updateSBTBalance` helper function for reliable SBT balance updates
- Fixed activities insertion to handle missing metadata column gracefully
- Updated all task completion flows to use proper SBT balance updates
- Improved error handling and fallback mechanisms
- Added parallel refresh of task status and balance after completion

### 2. IndexPage.tsx
- Updated `updateUserBalance` function to work with `total_sbt` column instead of `balance`
- Changed to use `increment_sbt` RPC function for SBT token updates
- Added proper error handling and fallback to direct updates

## Testing

After running the migration:

1. **Test Daily Login**: Should claim rewards and update SBT balance
2. **Test Social Tasks**: Should complete tasks and update SBT balance  
3. **Test Welcome Bonus**: Should claim bonus and update SBT balance
4. **Test Email Verification**: Should verify email and update SBT balance

All task completions should now:
- ✅ Record activities without metadata column errors
- ✅ Update SBT balance properly using `total_sbt` column
- ✅ Show updated balance in real-time
- ✅ Display success notifications with correct amounts

## Verification

Check that:
- No more PGRST204 errors in console
- SBT balance updates immediately after task completion
- Activities are recorded in database
- Task status updates correctly after completion