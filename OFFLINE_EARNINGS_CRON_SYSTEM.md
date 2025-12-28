# Offline Earnings & Cron Job System

## Overview

This system ensures users continue earning rewards even when offline and implements automated reward processing through cron jobs for accuracy and reliability.

## 🎯 Key Features

### 1. **Offline Earnings Persistence**
- Users earn rewards for up to 7 days while offline
- Automatic processing when users return
- Real-time calculation of pending offline rewards
- Seamless integration with existing reward system

### 2. **Automated Cron Jobs**
- Hourly reward processing for all active stakes
- Automatic cycle completion handling
- Error logging and monitoring
- Backup processing systems

### 3. **Smart Detection System**
- Detects when users return after being offline
- Automatically processes accumulated rewards
- Updates user interface with offline earnings
- Maintains reward accuracy across sessions

## 🏗️ System Architecture

### Database Functions
1. **`calculate_offline_earnings(user_id)`** - Calculates pending offline rewards
2. **`process_offline_earnings(user_id)`** - Processes and awards offline earnings
3. **`get_offline_earnings_summary(user_id)`** - Gets summary without processing
4. **`process_all_daily_rewards()`** - Batch processes all eligible stakes

### Edge Functions
- **`process-daily-rewards`** - Supabase Edge Function for cron processing
- Handles large-scale reward processing
- Provides detailed logging and error handling
- Supports both individual and batch operations

### Client-Side Hooks
- **`useOfflineEarnings`** - React hook for offline earnings management
- Automatic detection and processing
- Real-time status updates
- Integration with existing auth system

## 📋 Setup Instructions

### 1. Database Setup
```sql
-- Run the complete setup script
\i setup_offline_earnings_system.sql
```

### 2. Configure Supabase Settings
```sql
-- Set your Supabase URL and Service Role Key
SELECT set_config('app.settings.supabase_url', 'https://your-project.supabase.co', false);
SELECT set_config('app.settings.service_role_key', 'your-service-role-key', false);
```

### 3. Deploy Edge Function
```bash
# Deploy the Edge Function
supabase functions deploy process-daily-rewards
```

### 4. Enable Extensions
```sql
-- Enable required extensions in Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

## ⚙️ Configuration

### Cron Job Schedule
- **Primary Processing**: Every hour at minute 0
- **Backup Processing**: Every hour at minute 30
- **Log Cleanup**: Daily at 2 AM

### Offline Earnings Limits
- **Maximum Offline Days**: 7 days
- **Processing Trigger**: 1+ hour offline
- **Auto-Processing**: On user return

### Reward Calculation
```typescript
// Base daily ROI tiers
const roiTiers = {
  1000: 0.03,   // 3% for 1000+ TON
  500: 0.025,   // 2.5% for 500+ TON
  100: 0.02,    // 2% for 100+ TON
  50: 0.015,    // 1.5% for 50+ TON
  default: 0.01 // 1% base rate
};

// Duration bonus: up to 0.5% additional
const durationBonus = Math.min(daysSinceStart * 0.0001, 0.005);

// Rank bonuses
const rankBonuses = {
  GUARDIAN: 0.1,   // +10%
  SOVEREIGN: 0.15, // +15%
  CELESTIAL: 0.2   // +20%
};
```

## 🔧 Implementation Details

### Client-Side Integration
```typescript
// In your component
import { useOfflineEarnings } from '@/hooks/useOfflineEarnings';

const MyComponent = () => {
  const {
    hasOfflineEarnings,
    offlineAmount,
    daysOffline,
    processOfflineEarnings,
    isProcessing
  } = useOfflineEarnings();

  // Automatic processing happens in the hook
  // Manual processing available if needed
};
```

### Database Triggers
- **Auto-Processing**: Triggers when `last_active` is updated
- **Cycle Completion**: Automatic handling of 300% cycles
- **Error Recovery**: Fallback mechanisms for failed operations

## 📊 Monitoring & Logging

### Cron Job Status
```sql
-- Check cron job performance
SELECT * FROM cron_job_status;

-- View recent logs
SELECT * FROM cron_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Performance Metrics
- **Processing Time**: Average time per stake
- **Success Rate**: Percentage of successful operations
- **Error Tracking**: Detailed error logs with context
- **User Activity**: Offline/online patterns

## 🚨 Error Handling

### Automatic Recovery
- **Failed Stakes**: Individual stake failures don't stop batch processing
- **Database Errors**: Fallback to direct database operations
- **Network Issues**: Retry mechanisms with exponential backoff

### Manual Recovery
```sql
-- Manually process specific user
SELECT process_offline_earnings(user_id);

-- Batch process all users
SELECT process_all_daily_rewards();

-- Check for stuck stakes
SELECT * FROM stakes 
WHERE is_active = true 
AND last_payout < NOW() - INTERVAL '25 hours';
```

## 🔒 Security Considerations

### Database Security
- **RLS Policies**: Row-level security on all tables
- **Function Security**: SECURITY DEFINER for controlled access
- **Service Role**: Limited permissions for cron operations

### Data Integrity
- **Transaction Safety**: All operations wrapped in transactions
- **Validation**: Input validation on all functions
- **Audit Trail**: Complete logging of all reward operations

## 📈 Performance Optimization

### Database Indexes
```sql
-- Key indexes for performance
CREATE INDEX idx_stakes_last_payout_active ON stakes(last_payout) WHERE is_active = true;
CREATE INDEX idx_users_last_active ON users(last_active);
CREATE INDEX idx_earning_history_created_at ON earning_history(created_at);
```

### Batch Processing
- **Chunked Operations**: Process stakes in batches
- **Parallel Processing**: Multiple workers for large datasets
- **Resource Management**: Memory and CPU optimization

## 🧪 Testing

### Test Scenarios
1. **User Goes Offline**: Verify earnings accumulate
2. **User Returns**: Check automatic processing
3. **Long Offline Period**: Test 7-day limit
4. **Cron Job Failure**: Verify backup systems
5. **High Load**: Test with many concurrent users

### Test Commands
```sql
-- Simulate offline user
UPDATE users SET last_active = NOW() - INTERVAL '2 days' WHERE id = 1;

-- Check offline earnings
SELECT get_offline_earnings_summary(1);

-- Process manually
SELECT process_offline_earnings(1);
```

## 🚀 Deployment Checklist

- [ ] Database functions deployed
- [ ] Edge functions deployed
- [ ] Cron jobs scheduled
- [ ] Extensions enabled
- [ ] Indexes created
- [ ] Permissions granted
- [ ] Monitoring setup
- [ ] Error logging configured
- [ ] Client-side hooks integrated
- [ ] Testing completed

## 📞 Troubleshooting

### Common Issues
1. **Cron Jobs Not Running**: Check pg_cron extension and permissions
2. **Edge Function Errors**: Verify deployment and environment variables
3. **Missing Rewards**: Check stake eligibility and last_payout times
4. **Performance Issues**: Review indexes and query optimization

### Debug Queries
```sql
-- Check cron job status
SELECT * FROM cron.job ORDER BY jobid;

-- View recent errors
SELECT * FROM cron_logs WHERE error IS NOT NULL ORDER BY created_at DESC;

-- Check stake eligibility
SELECT id, user_id, amount, last_payout, 
       NOW() - last_payout as time_since_payout
FROM stakes 
WHERE is_active = true 
AND last_payout < NOW() - INTERVAL '24 hours';
```

This system ensures your users never miss out on rewards, whether they're online or offline, while maintaining accuracy and performance through automated processing.