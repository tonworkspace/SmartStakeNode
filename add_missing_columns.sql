-- Add missing columns to fix ReferralSystem and SocialTasks errors
-- This addresses multiple database schema issues

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add missing columns to referrals table
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS sbt_amount NUMERIC(18,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sbt_earned NUMERIC(18,8) DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_referrals_sbt_amount ON referrals(sbt_amount);
CREATE INDEX IF NOT EXISTS idx_referrals_total_sbt_earned ON referrals(total_sbt_earned);

-- Add comments for documentation
COMMENT ON COLUMN users.is_premium IS 'Premium status for enhanced referral rewards';
COMMENT ON COLUMN referrals.sbt_amount IS 'SBT reward amount for this referral';
COMMENT ON COLUMN referrals.total_sbt_earned IS 'Total SBT earned from this referral over time';