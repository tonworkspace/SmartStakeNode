-- Fix Stakes Table Schema
-- This script ensures the stakes table matches the expected structure

-- First, let's check if the table exists and what columns it has
-- Run this to see current structure: \d stakes

-- Add missing columns if they don't exist (safe to run multiple times)
DO $$ 
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE stakes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        -- Update existing records to have created_at values
        UPDATE stakes SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
    END IF;

    -- Add last_payout column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'last_payout'
    ) THEN
        ALTER TABLE stakes ADD COLUMN last_payout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        -- Update existing records to have last_payout values
        UPDATE stakes SET last_payout = CURRENT_TIMESTAMP WHERE last_payout IS NULL;
    END IF;

    -- Add cycle_progress column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'cycle_progress'
    ) THEN
        ALTER TABLE stakes ADD COLUMN cycle_progress NUMERIC(18,8) DEFAULT 0;
    END IF;

    -- Add total_earned column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'total_earned'
    ) THEN
        ALTER TABLE stakes ADD COLUMN total_earned NUMERIC(18,8) DEFAULT 0;
    END IF;

    -- Remove columns that shouldn't exist (if they do)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'speed_boost_active'
    ) THEN
        ALTER TABLE stakes DROP COLUMN speed_boost_active;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'start_date'
    ) THEN
        -- If start_date exists, copy its values to created_at before dropping
        UPDATE stakes SET created_at = start_date WHERE created_at IS NULL AND start_date IS NOT NULL;
        ALTER TABLE stakes DROP COLUMN start_date;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE stakes DROP COLUMN end_date;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'cycle_completed'
    ) THEN
        ALTER TABLE stakes DROP COLUMN cycle_completed;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stakes' AND column_name = 'cycle_completed_at'
    ) THEN
        ALTER TABLE stakes DROP COLUMN cycle_completed_at;
    END IF;

END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stakes_user_id_active ON stakes(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stakes_created_at ON stakes(created_at);
CREATE INDEX IF NOT EXISTS idx_stakes_last_payout ON stakes(last_payout);

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stakes' 
ORDER BY ordinal_position;

COMMENT ON TABLE stakes IS 'Stores user staking positions with earnings tracking';
COMMENT ON COLUMN stakes.user_id IS 'Reference to the user who owns this stake';
COMMENT ON COLUMN stakes.amount IS 'Amount of TON staked';
COMMENT ON COLUMN stakes.daily_rate IS 'Daily APY rate for this stake';
COMMENT ON COLUMN stakes.is_active IS 'Whether this stake is currently active';
COMMENT ON COLUMN stakes.cycle_progress IS 'Progress towards 300% cycle completion';
COMMENT ON COLUMN stakes.total_earned IS 'Total amount earned from this stake';
COMMENT ON COLUMN stakes.created_at IS 'When this stake was created';
COMMENT ON COLUMN stakes.last_payout IS 'When rewards were last calculated for this stake';