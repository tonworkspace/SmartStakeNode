# Database Functions Fix

## Issue
The `increment_sbt` and other RPC functions were trying to update a non-existent `updated_at` column in the `users` table, causing the error:
```
column "updated_at" of relation "users" does not exist
```

## Solution
Updated the SQL functions in `create_convert_sbt_to_ton_function.sql` to remove references to the `updated_at` column.

## Steps to Fix

### 1. Run the SQL Migration
Execute the following SQL in your Supabase SQL Editor:

```sql
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
```

### 2. Test the Functions
After running the migration, test the functions:

```sql
-- Test increment_sbt function
SELECT increment_sbt(1, 100);

-- Test increment_available_earnings function  
SELECT increment_available_earnings(1, 50);

-- Test convert_sbt_to_ton function
SELECT convert_sbt_to_ton(1, 10, 1);
```

### 3. Verify Integration
1. Navigate to your staking app
2. Try claiming rewards in MiningScreen
3. Check that balances update in WithdrawalComponent
4. Test SBT conversions and withdrawals

## Changes Made

### Fixed Functions
- ✅ `increment_sbt()` - Removed `updated_at` reference
- ✅ `increment_available_earnings()` - Removed `updated_at` reference  
- ✅ `convert_sbt_to_ton()` - Removed `updated_at` reference
- ✅ Added `increment_balance()` for general balance updates

### Enhanced Error Handling
- Added `COALESCE()` to handle NULL values safely
- Proper exception handling with descriptive messages
- Fallback logic in client code for RPC failures

### Client-Side Updates
- ✅ IndexPage.tsx - Enhanced error handling for SBT updates
- ✅ SocialTasks.tsx - Already had proper fallback logic
- ✅ MiningScreen.tsx - Uses new `increment_available_earnings()` function
- ✅ WithdrawalComponent.tsx - Real-time updates and proper error handling

## Expected Results
After applying these fixes:
- ✅ No more "updated_at column does not exist" errors
- ✅ SBT balance updates work properly
- ✅ Staking rewards reflect in withdrawal component
- ✅ Real-time balance synchronization
- ✅ Proper fallback mechanisms for failed RPC calls

## Troubleshooting
If you still encounter issues:

1. **Check if functions exist:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('increment_sbt', 'increment_available_earnings', 'convert_sbt_to_ton');
   ```

2. **Verify user table structure:**
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
   ```

3. **Test with a specific user:**
   ```sql
   SELECT id, total_sbt, available_earnings, balance FROM users WHERE id = YOUR_USER_ID;
   ```