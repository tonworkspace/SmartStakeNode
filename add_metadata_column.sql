-- Add metadata column to activities table
-- Run this in your Supabase SQL Editor to fix the metadata error

-- Add metadata column if it doesn't exist
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
        RAISE NOTICE 'Metadata column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Metadata column added successfully! Social tasks should now work.' as result;