-- Migration: Add missing columns for Social Tasks functionality
-- Date: 2024-12-22
-- Description: Adds required columns to users table and updates completed_tasks table for task tracking

-- Add missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_daily_claim_date DATE,
ADD COLUMN IF NOT EXISTS daily_streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add missing columns to referrals table if they don't exist
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS sbt_amount NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sbt_earned NUMERIC(18,8) DEFAULT 0;

-- Check if completed_tasks table exists and modify it for social tasks
DO $$ 
BEGIN
    -- Add task_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_tasks' AND column_name = 'task_type'
    ) THEN
        ALTER TABLE completed_tasks ADD COLUMN task_type VARCHAR(100);
    END IF;
    
    -- Add reward_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_tasks' AND column_name = 'reward_amount'
    ) THEN
        ALTER TABLE completed_tasks ADD COLUMN reward_amount INTEGER DEFAULT 0;
    END IF;
    
    -- Modify task_id to allow both integer and string values
    -- We'll keep the existing structure but add a string_task_id for social tasks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_tasks' AND column_name = 'string_task_id'
    ) THEN
        ALTER TABLE completed_tasks ADD COLUMN string_task_id VARCHAR(255);
    END IF;
END $$;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_last_daily_claim ON users(last_daily_claim_date);
CREATE INDEX IF NOT EXISTS idx_users_daily_streak ON users(daily_streak_count);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_string_task_id ON completed_tasks(string_task_id);
CREATE INDEX IF NOT EXISTS idx_completed_tasks_task_type ON completed_tasks(task_type);

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
    END IF;
END $$;

-- Update the unique constraint to handle both task_id types
DO $$
BEGIN
    -- Drop existing unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'completed_tasks' 
        AND constraint_name = 'completed_tasks_user_id_task_id_key'
    ) THEN
        ALTER TABLE completed_tasks DROP CONSTRAINT completed_tasks_user_id_task_id_key;
    END IF;
    
    -- Add new unique constraint that works with string_task_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'completed_tasks' 
        AND constraint_name = 'completed_tasks_user_string_task_unique'
    ) THEN
        ALTER TABLE completed_tasks ADD CONSTRAINT completed_tasks_user_string_task_unique 
        UNIQUE(user_id, string_task_id);
    END IF;
END $$;

-- Add RLS (Row Level Security) policies for completed_tasks if not already enabled
DO $$
BEGIN
    -- For Telegram-based authentication, we'll disable RLS on completed_tasks
    -- since auth.uid() won't work with custom authentication systems
    
    -- Disable RLS if it's enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'completed_tasks' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE completed_tasks DISABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own completed tasks" ON completed_tasks;
        DROP POLICY IF EXISTS "Users can insert own completed tasks" ON completed_tasks;
        
        RAISE NOTICE 'RLS disabled for completed_tasks table to work with Telegram authentication';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN completed_tasks.string_task_id IS 'String identifier for social tasks (matches Task.id in frontend)';
COMMENT ON COLUMN completed_tasks.task_type IS 'Type of task completed (daily_login, twitter_like, etc.)';
COMMENT ON COLUMN completed_tasks.reward_amount IS 'Amount of Smart rewarded for task completion';
COMMENT ON COLUMN users.last_daily_claim_date IS 'Date of last daily login reward claim';
COMMENT ON COLUMN users.daily_streak_count IS 'Current consecutive daily login streak';
COMMENT ON COLUMN users.email IS 'User email for verification tasks';
COMMENT ON COLUMN users.is_premium IS 'Premium status for enhanced referral rewards';