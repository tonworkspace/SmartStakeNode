// Types for deposit balance sync system
export interface DepositResult {
  success: boolean;
  depositId?: number;
  txHash?: string;
  error?: string;
  newBalance?: number;
}

export interface UserBalanceState {
  userId: number;
  balance: number;
  previousBalance: number;
  lastUpdated: string;
  isLoading: boolean;
  error?: string;
  pendingDeposits: number[];
}

export interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error?: string;
  hasMore: boolean;
  lastFetched: string;
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  table: string;
}

export interface FormattedActivity {
  id: string;
  type: ActivityType;
  amount: string;
  formattedAmount: string;
  timestamp: string;
  relativeTime: string;
  status: string;
  icon: React.ReactNode;
  color: string;
}

export type ActivityType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'stake' 
  | 'redeposit' 
  | 'nova_reward' 
  | 'nova_income'
  | 'offline_reward'
  | 'earnings_update'
  | 'claim'
  | 'transfer'
  | 'reward'
  | 'bonus'
  | 'top_up';

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  amount: number;
  status: string;
  created_at: string;
  deposit_id?: number;
}

export interface SyncOperation {
  id: string;
  userId: number;
  type: 'balance_update' | 'activity_sync' | 'user_refresh';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'alert' | 'ignore';
  delay?: number;
  maxRetries?: number;
  fallbackAction?: () => Promise<void>;
}