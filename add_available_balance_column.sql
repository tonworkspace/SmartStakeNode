-- Add available_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_balance NUMERIC(18,8) DEFAULT 0;

-- Add index for available_balance column
CREATE INDEX IF NOT EXISTS idx_users_available_balance ON users(available_balance);

-- Verify the column was added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'available_balance';