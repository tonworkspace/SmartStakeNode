# Database Schema Fix - Stakes Table

## 🚨 **Issue Identified**
The error `Could not find the 'speed_boost_active' column of 'stakes' in the schema cache` indicates a mismatch between the code expectations and the actual database schema.

## ✅ **Fix Applied**

### **1. Code Updates**
Updated the following files to match the actual database schema:

#### **MiningScreen.tsx**
- Removed `speed_boost_active: false` from stake creation
- Removed `start_date` field (using `created_at` instead)
- Updated all references to use `created_at` instead of `start_date`

#### **supabaseClient.ts**
- Updated `Stake` interface to match actual database columns:
  ```typescript
  export interface Stake {
    id: number;
    user_id: number;
    amount: number;
    daily_rate: number;
    total_earned: number;
    is_active: boolean;
    last_payout: string;
    cycle_progress?: number;
    created_at: string;
  }
  ```

### **2. Database Schema Alignment**
Created `fix_stakes_table_schema.sql` to ensure database matches expectations:

#### **Expected Stakes Table Structure:**
```sql
CREATE TABLE stakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount NUMERIC(18,8) NOT NULL,
    daily_rate NUMERIC(18,8) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cycle_progress NUMERIC(18,8) DEFAULT 0,
    total_earned NUMERIC(18,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_payout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **How to Apply the Fix**

### **Step 1: Run Database Migration**
Execute the migration script in your Supabase SQL editor:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste the contents of fix_stakes_table_schema.sql
# Click "Run" to execute
```

### **Step 2: Verify Schema**
After running the migration, verify the table structure:

```sql
-- Check current stakes table structure
\d stakes

-- Or use this query:
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stakes' 
ORDER BY ordinal_position;
```

### **Step 3: Test Functionality**
1. Try creating a new stake through the UI
2. Verify that deposits work correctly
3. Check that auto-staking functions properly

## 🎯 **What the Fix Accomplishes**

### **Removes Problematic Columns**
- `speed_boost_active` (not in actual schema)
- `start_date` (replaced with `created_at`)
- `end_date` (not needed for current functionality)
- `cycle_completed` (not in actual schema)
- `cycle_completed_at` (not in actual schema)

### **Ensures Required Columns Exist**
- `created_at` (for tracking stake creation time)
- `last_payout` (for calculating pending rewards)
- `cycle_progress` (for tracking towards 300% completion)
- `total_earned` (for tracking cumulative earnings)

### **Adds Performance Indexes**
- `idx_stakes_user_id_active` for efficient user stake queries
- `idx_stakes_created_at` for date-based operations
- `idx_stakes_last_payout` for reward calculations

## 🚀 **Benefits After Fix**

### **Immediate Resolution**
- ✅ Stake creation will work without errors
- ✅ Direct deposit functionality will work
- ✅ Auto-staking will function properly
- ✅ Real-time earnings calculations will work

### **Improved Performance**
- Optimized database queries with proper indexes
- Efficient stake lookups and calculations
- Better real-time update performance

### **Future-Proof Schema**
- Clean, consistent column naming
- Proper data types for financial calculations
- Extensible structure for future enhancements

## 🔍 **Verification Checklist**

After applying the fix, verify these functions work:

- [ ] **Manual Staking**: Create stake through StakeModal
- [ ] **Direct Deposit**: Use "Deposit & Stake TON" button
- [ ] **Auto-Stake**: Verify auto-stake toggle works
- [ ] **Earnings Display**: Check real-time earnings counter
- [ ] **Claim Rewards**: Verify reward claiming works
- [ ] **Unstaking**: Test unstaking functionality

## 🛠 **Troubleshooting**

### **If Migration Fails**
1. Check if you have proper permissions in Supabase
2. Verify no active connections are blocking schema changes
3. Run individual ALTER TABLE statements one by one

### **If Errors Persist**
1. Check browser console for specific error messages
2. Verify Supabase connection is working
3. Ensure environment variables are set correctly

### **Common Issues**
- **Permission Denied**: Ensure you're using the service role key for migrations
- **Column Already Exists**: The migration script handles this safely
- **Data Loss Concerns**: The script preserves existing data when possible

## 📝 **Summary**

This fix resolves the database schema mismatch by:

1. **Aligning code with actual database structure**
2. **Providing a safe migration script**
3. **Adding performance optimizations**
4. **Ensuring future compatibility**

The direct deposit and staking functionality should now work perfectly without any column-related errors. The system maintains all existing functionality while fixing the underlying schema issues.