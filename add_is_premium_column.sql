-- Add missing is_premium column to users table
-- This fixes the ReferralSystem error: column users_1.is_premium does not exist

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);

-- Add comment for documentation
COMMENT ON COLUMN users.is_premium IS 'Premium status for enhanced referral rewards';