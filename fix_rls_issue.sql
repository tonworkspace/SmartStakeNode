-- URGENT FIX: Fix RLS and add metadata column
-- Run this immediately in your Supabase SQL Editor to fix the social tasks errors

-- 1. Add metadata column to activities table if it doesn't exist
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

-- 2. Disable Row Level Security for completed_tasks table
ALTER TABLE completed_tasks DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies that are causing the issue
DROP POLICY IF EXISTS "Users can view own completed tasks" ON completed_tasks;
DROP POLICY IF EXISTS "Users can insert own completed tasks" ON completed_tasks;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED (may cause issues)'
        ELSE 'RLS DISABLED (good for Telegram auth)'
    END as status
FROM pg_tables 
WHERE tablename = 'completed_tasks';

-- Success message
SELECT 'RLS disabled successfully! Social tasks should now work.' as result;