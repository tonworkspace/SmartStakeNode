# Smart Token Reward System - Complete Guide

## How Rewards Are Stored and Displayed

### 📊 **Database Storage**

When a user claims a reward, the system stores the information in **two places**:

#### 1. **Activities Table** (Transaction Log)
```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR NOT NULL,              -- 'smart_claim'
    amount NUMERIC(18,8) DEFAULT 0,     -- Reward amount
    status VARCHAR DEFAULT 'PENDING',   -- 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB                      -- Task details
);
```

**Purpose**: Records every reward transaction for audit trail and history

#### 2. **Users Table** (Current Balance)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    balance NUMERIC(18,8) DEFAULT 0,    -- Current Smart token balance
    -- ... other user fields
);
```

**Purpose**: Stores the user's current total Smart token balance

### 🔄 **Reward Flow Process**

When a user completes a task:

1. **Task Completion**: Record in `completed_tasks` table
2. **Activity Logging**: Insert transaction in `activities` table
3. **Balance Update**: Add reward amount to user's `balance`
4. **UI Update**: Refresh balance display in real-time

### 🎨 **UI Display Features**

#### **Balance Display**
- **Location**: Top-right corner of Earning Center
- **Design**: Green badge with Star icon
- **Format**: `1,234 Smart` (with number formatting)
- **Updates**: Real-time after each reward claim

#### **Visual Elements**
```jsx
<div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-2xl border border-green-500/20">
  <Star size={16} className="text-green-500 fill-green-500" />
  <span className="text-sm font-black text-green-600 dark:text-green-400">
    {userBalance.toLocaleString()} Smart
  </span>
</div>
<span className="text-[10px] text-slate-400 mt-1 font-medium">Your Balance</span>
```

### 💰 **Reward Amounts by Task Type**

| Task Type | Reward Amount | Description |
|-----------|---------------|-------------|
| **Welcome Bonus** | 500 Smart | One-time signup bonus |
| **Email Verification** | 500 Smart | Account security verification |
| **Daily Login** | 500-25,000 Smart | Based on streak (7d=10k, 14d=15k, 21d=20k, 28d=25k) |
| **Twitter Like** | 750 Smart | Social engagement |
| **Twitter Retweet** | 1,000 Smart | Content sharing |
| **Twitter Follow** | 800 Smart | Account following |
| **Twitter Comment** | 650 Smart | Community interaction |
| **Telegram Join** | 600 Smart | Community participation |
| **Telegram Discussion** | 400 Smart | Group participation |
| **Referral Contest** | 1,000 Smart | Contest entry bonus |

### 🔧 **Technical Implementation**

#### **Balance Update Function**
```sql
CREATE OR REPLACE FUNCTION increment_user_balance(user_id INTEGER, amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET balance = COALESCE(balance, 0) + amount 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

#### **React State Management**
```typescript
const [userBalance, setUserBalance] = useState<number>(0);

const refreshUserBalance = async () => {
  const { data: userData } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();
  
  if (userData?.balance !== undefined) {
    setUserBalance(Number(userData.balance) || 0);
  }
};
```

### 📱 **User Experience**

#### **Reward Claiming Flow**
1. User clicks task button
2. Loading state shows during processing
3. Success toast shows: `"Task verified! +750 Smart"`
4. Balance updates immediately in UI
5. Task status changes to "Done"

#### **Visual Feedback**
- ✅ **Success Toast**: Shows reward amount
- 🔄 **Loading States**: During claim processing  
- 💚 **Balance Badge**: Real-time balance updates
- ✨ **Task Status**: Visual completion indicators

### 🛠 **Database Migration Required**

To enable the balance display, run this SQL in your Supabase dashboard:

```sql
-- Add the balance increment function
CREATE OR REPLACE FUNCTION increment_user_balance(user_id INTEGER, amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET balance = COALESCE(balance, 0) + amount 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

### 🎯 **Key Benefits**

1. **Transparency**: Users see their exact Smart token balance
2. **Real-time Updates**: Balance updates immediately after claims
3. **Audit Trail**: Complete transaction history in activities table
4. **User Engagement**: Visual progress motivates continued participation
5. **Trust Building**: Clear reward tracking builds user confidence

### 🔍 **Monitoring & Analytics**

#### **Track User Engagement**
```sql
-- Total rewards claimed by user
SELECT user_id, SUM(amount) as total_earned
FROM activities 
WHERE type = 'smart_claim' AND status = 'completed'
GROUP BY user_id;

-- Most popular tasks
SELECT metadata->>'task_type' as task_type, COUNT(*) as completions
FROM activities 
WHERE type = 'smart_claim' 
GROUP BY metadata->>'task_type'
ORDER BY completions DESC;
```

#### **Balance Verification**
```sql
-- Verify balance matches activity sum
SELECT 
  u.id,
  u.balance as current_balance,
  COALESCE(SUM(a.amount), 0) as calculated_balance
FROM users u
LEFT JOIN activities a ON u.id = a.user_id 
  AND a.type = 'smart_claim' 
  AND a.status = 'completed'
GROUP BY u.id, u.balance;
```

---

**Status**: ✅ Fully implemented and ready for use
**Next Steps**: Run the migration SQL and test the reward system