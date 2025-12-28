import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase initialization - SECURITY FIXED: Removed hardcoded credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced environment validation
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required. Please add it to your .env file');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please add it to your .env file');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error('VITE_SUPABASE_URL must be a valid URL');
}

// Validate key format (basic JWT structure check)
if (!supabaseAnonKey.includes('.') || supabaseAnonKey.split('.').length !== 3) {
  throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid (not a valid JWT format)');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ==========================================
// INPUT VALIDATION & SANITIZATION
// ==========================================

// Input sanitization utilities
export const sanitizeInput = {
  // Sanitize wallet address
  walletAddress: (address: string): string => {
    if (typeof address !== 'string') return '';
    // Remove any non-alphanumeric characters except colons and hyphens for TON addresses
    return address.replace(/[^a-zA-Z0-9:-]/g, '').slice(0, 100);
  },

  // Sanitize username
  username: (username: string): string => {
    if (typeof username !== 'string') return '';
    // Allow alphanumeric, underscore, and hyphen
    return username.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  },

  // Sanitize transaction hash
  transactionHash: (hash: string): string => {
    if (typeof hash !== 'string') return '';
    // Allow only hexadecimal characters
    return hash.replace(/[^a-fA-F0-9]/g, '').slice(0, 100);
  },

  // Sanitize numeric amounts
  amount: (amount: number | string): number => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num) || !isFinite(num) || num < 0) return 0;
    // Cap at reasonable maximum
    return Math.min(num, 1000000);
  },

  // Sanitize telegram ID
  telegramId: (id: number | string): number => {
    const num = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(num) || !isFinite(num) || num <= 0) return 0;
    return Math.abs(Math.floor(num));
  }
};

// Validation functions
export const validateInput = {
  // Validate TON wallet address format
  walletAddress: (address: string): boolean => {
    if (!address || typeof address !== 'string') return false;
    // Basic TON address validation (simplified)
    const tonAddressRegex = /^[a-zA-Z0-9_-]{48}$|^[a-zA-Z0-9:_-]{48,}$/;
    return tonAddressRegex.test(address) && address.length >= 48 && address.length <= 100;
  },

  // Validate transaction hash
  transactionHash: (hash: string): boolean => {
    if (!hash || typeof hash !== 'string') return false;
    // Basic hex validation
    const hexRegex = /^[a-fA-F0-9]{64}$/;
    return hexRegex.test(hash);
  },

  // Validate amount
  amount: (amount: number): boolean => {
    return typeof amount === 'number' && 
           isFinite(amount) && 
           amount >= 0 && 
           amount <= 1000000;
  },

  // Validate user ID
  userId: (id: number): boolean => {
    return typeof id === 'number' && 
           isFinite(id) && 
           id > 0 && 
           Number.isInteger(id);
  }
};

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface User {
  id: number;
  telegram_id: number;
  wallet_address: string;
  username?: string;
  created_at: string;
  balance: number;
  total_deposit: number;
  total_withdrawn: number;
  team_volume: number;
  rank: string;
  last_active: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  last_claim_time?: number;
  total_earned?: number;
  total_sbt?: number;
  is_active: boolean;
  reinvestment_balance?: number;
  available_balance?: number;
  sbt_last_updated?: string;
  last_rank_bonus?: string;
  stake: number;
  is_premium: boolean;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  updated_at?: string;
  sponsor_code?: string;
  sponsor_id?: number;
  current_deposit?: number;
  speed_boost_active?: boolean;
  last_weekly_withdrawal?: string;
  available_earnings?: number;
  rank_updated_at?: string;
  login_streak?: number;
  last_login_date?: string;
  direct_referrals?: number;
  last_deposit_time: string | null;
  has_nft?: boolean;
  referrer_username?: string;
  referrer_rank?: string;
  claimed_milestones?: number[];
  expected_rank_bonus?: number;
  stake_date?: string;
  current_stake_date?: string;
  whitelisted_wallet?: string;
  payout_wallet?: string;
  pending_withdrawal?: boolean;
  pending_withdrawal_id?: number;
  payout_balance?: number;
  total_payout?: number;
}

export interface Stake {
  id: number;
  user_id: number;
  amount: number;
  daily_rate: number;
  total_earned: number;
  is_active: boolean;
  last_payout: string;
  cycle_progress?: number;
  created_at: string;
}

export interface Deposit {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  created_at: string;
  processed_at?: string;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  wallet_amount: number;
  redeposit_amount: number;
  sbt_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  transaction_hash?: string;
}

export interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_contract: string;
  token_symbol: string;
  chain_id: number;
  thirdweb_transaction_id?: string;
  transaction_hash?: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
  from_user?: User;
  to_user?: User;
}

export interface MiningSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'expired';
  rzc_earned: number;
  created_at: string;
  completed_at?: string;
}

export interface RZCBalance {
  user_id: number;
  claimable_rzc: number;
  total_rzc_earned: number;
  last_claim_time?: string;
  created_at: string;
  updated_at: string;
}

export interface FreeMiningPeriod {
  user_id: number;
  start_date: string;
  end_date: string;
  grace_period_end: string;
  is_active: boolean;
  sessions_used: number;
  max_sessions: number;
  is_in_grace_period: boolean;
  days_remaining: number;
  sessions_remaining: number;
  can_mine: boolean;
  reason: string;
}

// ==========================================
// ENHANCED EARNINGS PERSISTENCE MANAGER
// ==========================================

interface EarningsState {
  userId: number;
  realTimeEarnings: number;
  lastSyncTime: number;
  pendingSync: boolean;
  syncQueue: Array<{
    amount: number;
    timestamp: number;
    type: 'increment' | 'set';
  }>;
}

class EarningsPersistenceManager {
  private static instance: EarningsPersistenceManager;
  private earningsState: Map<number, EarningsState> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly LOCALSTORAGE_KEY_PREFIX = 'mining_earnings_';
  private readonly OFFLINE_QUEUE_KEY = 'mining_offline_queue';
  private isOnline: boolean = true;

  static getInstance(): EarningsPersistenceManager {
    if (!EarningsPersistenceManager.instance) {
      EarningsPersistenceManager.instance = new EarningsPersistenceManager();
    }
    return EarningsPersistenceManager.instance;
  }

  private constructor() {
    this.setupNetworkMonitoring();
    this.loadFromLocalStorage();
    this.startSyncInterval();
    this.setupBeforeUnloadHandler();
  }

  // Initialize user earnings state with localStorage recovery
  initializeUser(userId: number, initialEarnings: number = 0): void {
    if (!validateInput.userId(userId)) {
      console.error('Invalid user ID for earnings initialization');
      return;
    }

    if (!this.earningsState.has(userId)) {
      // Try to recover from localStorage first
      const savedState = this.loadUserFromLocalStorage(userId);
      
      if (savedState) {
        console.log(`Recovered earnings from localStorage for user ${userId}: ${savedState.realTimeEarnings}`);
        this.earningsState.set(userId, savedState);
      } else {
        // Create new state
        const newState: EarningsState = {
          userId,
          realTimeEarnings: initialEarnings,
          lastSyncTime: Date.now(),
          pendingSync: false,
          syncQueue: []
        };
        this.earningsState.set(userId, newState);
        this.saveUserToLocalStorage(userId, newState);
      }
    }
  }

  // Update real-time earnings with localStorage backup
  updateRealTimeEarnings(userId: number, amount: number, type: 'increment' | 'set' = 'increment'): void {
    if (!validateInput.userId(userId) || !validateInput.amount(amount)) {
      console.error('Invalid parameters for earnings update');
      return;
    }

    const state = this.earningsState.get(userId);
    if (!state) {
      this.initializeUser(userId, type === 'set' ? amount : 0);
      return;
    }

    // Update real-time earnings
    if (type === 'increment') {
      state.realTimeEarnings += amount;
    } else {
      state.realTimeEarnings = amount;
    }

    // Add to sync queue
    state.syncQueue.push({
      amount: state.realTimeEarnings,
      timestamp: Date.now(),
      type: 'set'
    });

    // Save to localStorage immediately for persistence
    this.saveUserToLocalStorage(userId, state);

    // If offline, add to offline queue
    if (!this.isOnline) {
      this.addToOfflineQueue(userId, amount, type);
    }

    // Trigger immediate sync if queue is getting large and we're online
    if (state.syncQueue.length >= 10 && this.isOnline) {
      this.syncUserEarnings(userId);
    }
  }

  // Get current real-time earnings
  getRealTimeEarnings(userId: number): number {
    if (!validateInput.userId(userId)) return 0;
    
    const state = this.earningsState.get(userId);
    return state?.realTimeEarnings || 0;
  }

  // Sync earnings to database with retry logic and offline support
  private async syncUserEarnings(userId: number, attempt: number = 1): Promise<boolean> {
    const state = this.earningsState.get(userId);
    if (!state || state.pendingSync || state.syncQueue.length === 0) {
      return false;
    }

    // Skip sync if offline
    if (!this.isOnline) {
      console.log(`Skipping sync for user ${userId} - offline mode`);
      return false;
    }

    state.pendingSync = true;

    try {
      // Get the latest earnings value from queue
      const latestEarnings = state.syncQueue[state.syncQueue.length - 1];
      
      // Validate earnings before sync
      if (!validateInput.amount(latestEarnings.amount)) {
        console.error('Invalid earnings amount, skipping sync');
        state.syncQueue = [];
        state.pendingSync = false;
        return false;
      }

      // Sync to database
      const { error } = await supabase
        .from('users')
        .update({ 
          total_earned: latestEarnings.amount,
          last_sync: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Clear sync queue on success
      state.syncQueue = [];
      state.lastSyncTime = Date.now();
      state.pendingSync = false;

      // Update localStorage with successful sync
      this.saveUserToLocalStorage(userId, state);

      console.log(`Earnings synced successfully for user ${userId}: ${latestEarnings.amount}`);
      return true;

    } catch (error) {
      console.error(`Earnings sync failed for user ${userId} (attempt ${attempt}):`, error);
      
      // Retry logic with exponential backoff
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          this.syncUserEarnings(userId, attempt + 1);
        }, this.RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      } else {
        console.error(`Max retry attempts reached for user ${userId}, sync failed`);
        // Keep the sync queue for next interval attempt
        // Add to offline queue for later processing
        this.addToOfflineQueue(userId, state.realTimeEarnings, 'set');
      }

      state.pendingSync = false;
      return false;
    }
  }

  // localStorage Management Methods
  private saveUserToLocalStorage(userId: number, state: EarningsState): void {
    try {
      const key = `${this.LOCALSTORAGE_KEY_PREFIX}${userId}`;
      const dataToSave = {
        ...state,
        savedAt: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn(`Failed to save earnings to localStorage for user ${userId}:`, error);
    }
  }

  private loadUserFromLocalStorage(userId: number): EarningsState | null {
    try {
      const key = `${this.LOCALSTORAGE_KEY_PREFIX}${userId}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Remove the savedAt timestamp before returning
        const { savedAt, ...state } = parsed;
        return state as EarningsState;
      }
    } catch (error) {
      console.warn(`Failed to load earnings from localStorage for user ${userId}:`, error);
    }
    return null;
  }

  private loadFromLocalStorage(): void {
    try {
      // Load all user earnings from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.LOCALSTORAGE_KEY_PREFIX)) {
          const userId = parseInt(key.replace(this.LOCALSTORAGE_KEY_PREFIX, ''));
          if (!isNaN(userId)) {
            const state = this.loadUserFromLocalStorage(userId);
            if (state) {
              this.earningsState.set(userId, state);
              console.log(`Loaded earnings from localStorage for user ${userId}: ${state.realTimeEarnings}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load earnings from localStorage:', error);
    }
  }

  // Offline Queue Management
  private addToOfflineQueue(userId: number, amount: number, type: 'increment' | 'set'): void {
    try {
      const queue = this.getOfflineQueue();
      queue.push({
        userId,
        amount,
        type,
        timestamp: Date.now()
      });
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to add to offline queue:', error);
    }
  }

  private getOfflineQueue(): Array<{userId: number, amount: number, type: string, timestamp: number}> {
    try {
      const stored = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to get offline queue:', error);
      return [];
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const queue = this.getOfflineQueue();
      if (queue.length === 0) return;

      console.log(`Processing ${queue.length} offline earnings updates...`);

      // Group by userId and process
      const userUpdates = new Map<number, number>();
      
      for (const item of queue) {
        if (item.type === 'set') {
          userUpdates.set(item.userId, item.amount);
        } else if (item.type === 'increment') {
          const current = userUpdates.get(item.userId) || 0;
          userUpdates.set(item.userId, current + item.amount);
        }
      }

      // Sync each user's final amount
      for (const [userId, finalAmount] of userUpdates) {
        const state = this.earningsState.get(userId);
        if (state) {
          state.realTimeEarnings = finalAmount;
          state.syncQueue.push({
            amount: finalAmount,
            timestamp: Date.now(),
            type: 'set'
          });
          await this.syncUserEarnings(userId);
        }
      }

      // Clear offline queue after successful processing
      localStorage.removeItem(this.OFFLINE_QUEUE_KEY);
      console.log('Offline queue processed successfully');

    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  // Network Monitoring
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Initial online status
    this.isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.isOnline = true;
      // Process any queued offline updates
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost - switching to offline mode');
      this.isOnline = false;
    });

    // Periodic connectivity check
    setInterval(() => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (!wasOnline && this.isOnline) {
        console.log('Network connectivity detected - processing offline queue');
        this.processOfflineQueue();
      }
    }, 10000); // Check every 10 seconds
  }

  // Reconcile earnings with database and localStorage
  async reconcileEarnings(userId: number): Promise<number> {
    if (!validateInput.userId(userId)) return 0;

    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('total_earned')
        .eq('id', userId)
        .single();

      if (error || !dbUser) {
        console.error('Failed to fetch user earnings for reconciliation:', error);
        // If database fails, use localStorage as fallback
        const localState = this.loadUserFromLocalStorage(userId);
        return localState?.realTimeEarnings || 0;
      }

      const dbEarnings = dbUser.total_earned || 0;
      const state = this.earningsState.get(userId);
      const localEarnings = state?.realTimeEarnings || 0;

      // Use the higher value between database and local storage
      const reconciledEarnings = Math.max(dbEarnings, localEarnings);

      if (state) {
        // Update local state to match reconciled value
        state.realTimeEarnings = reconciledEarnings;
        state.syncQueue = [];
        state.lastSyncTime = Date.now();
        this.saveUserToLocalStorage(userId, state);
      } else {
        this.initializeUser(userId, reconciledEarnings);
      }

      // If local earnings are higher, sync to database
      if (localEarnings > dbEarnings && this.isOnline) {
        console.log(`Local earnings higher than database, syncing: ${localEarnings} > ${dbEarnings}`);
        this.syncUserEarnings(userId);
      }

      return reconciledEarnings;

    } catch (error) {
      console.error('Earnings reconciliation failed:', error);
      // Fallback to localStorage
      const localState = this.loadUserFromLocalStorage(userId);
      return localState?.realTimeEarnings || 0;
    }
  }

  // Force sync all pending earnings with offline support
  async forceSyncAll(): Promise<void> {
    // Save all current states to localStorage first
    for (const [userId, state] of this.earningsState) {
      this.saveUserToLocalStorage(userId, state);
    }

    // If online, attempt database sync
    if (this.isOnline) {
      const syncPromises = Array.from(this.earningsState.keys()).map(userId => 
        this.syncUserEarnings(userId)
      );
      
      await Promise.allSettled(syncPromises);
    } else {
      console.log('Offline mode - earnings saved to localStorage only');
    }
  }

  // Start automatic sync interval with offline awareness
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      // Always save to localStorage
      for (const [userId, state] of this.earningsState) {
        this.saveUserToLocalStorage(userId, state);
      }

      // Only sync to database if online
      if (this.isOnline) {
        for (const userId of this.earningsState.keys()) {
          await this.syncUserEarnings(userId);
        }
      }
    }, this.SYNC_INTERVAL_MS);
  }

  // Enhanced setup handler with localStorage backup
  private setupBeforeUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Always save to localStorage before page unload
        for (const [userId, state] of this.earningsState) {
          this.saveUserToLocalStorage(userId, state);
        }
        
        // Attempt synchronous sync if online
        if (this.isOnline) {
          this.forceSyncAll();
        }
      });

      // Also handle visibility change (when tab becomes hidden)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Save to localStorage when tab becomes hidden
          for (const [userId, state] of this.earningsState) {
            this.saveUserToLocalStorage(userId, state);
          }
          
          if (this.isOnline) {
            this.forceSyncAll();
          }
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus(): { isOnline: boolean; hasOfflineQueue: boolean } {
    const offlineQueue = this.getOfflineQueue();
    return {
      isOnline: this.isOnline,
      hasOfflineQueue: offlineQueue.length > 0
    };
  }

  // Clear user data (for logout)
  clearUserData(userId: number): void {
    try {
      // Remove from memory
      this.earningsState.delete(userId);
      
      // Remove from localStorage
      const key = `${this.LOCALSTORAGE_KEY_PREFIX}${userId}`;
      localStorage.removeItem(key);
      
      console.log(`Cleared earnings data for user ${userId}`);
    } catch (error) {
      console.warn(`Failed to clear earnings data for user ${userId}:`, error);
    }
  }

  // Cleanup with localStorage preservation
  destroy(): void {
    // Save all current states to localStorage before destroying
    for (const [userId, state] of this.earningsState) {
      this.saveUserToLocalStorage(userId, state);
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Don't clear earningsState completely - keep for potential recovery
    console.log('EarningsPersistenceManager destroyed - data preserved in localStorage');
  }
}

// Export singleton instance
export const earningsPersistence = EarningsPersistenceManager.getInstance();

// ==========================================
// CONSTANTS & CONFIG
// ==========================================

export const SPEED_BOOST_MULTIPLIER = 2;
export const FAST_START_BONUS_AMOUNT = 1; // 1 TON
export const FAST_START_REQUIRED_REFERRALS = 2;
export const FAST_START_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const STAKING_CONFIG = {
  DAILY_RATES: {
    WEEK1: 0.01, // 1% (days 1-7)
    WEEK2: 0.02, // 2% (days 8-14)
    WEEK3: 0.03, // 3% (days 15-21)
    WEEK4: 0.04  // 4% (days 22+)
  },
  MAX_CYCLE_PERCENTAGE: 300,
  MIN_DEPOSIT: 1, // 1 TON
  FEES: {
    DEPOSIT_STK: 0.05, // 5% to STK
    WITHDRAWAL_STK: 0.10, // 10% to STK
    WITHDRAWAL_GLP: 0.10, // 10% to GLP
    WITHDRAWAL_REINVEST: 0.20 // 20% to reinvestment wallet
  }
};

export const RANK_REQUIREMENTS = {
  NOVICE: { title: 'Novice', minStake: 0, minEarnings: 0, color: 'gray', weeklyBonus: 0, icon: 'sparkle' },
  EXPLORER: { title: 'Explorer', minStake: 20, minEarnings: 100, color: 'green', weeklyBonus: 5, icon: 'compass' },
  VOYAGER: { title: 'Voyager', minStake: 50, minEarnings: 500, color: 'blue', weeklyBonus: 10, icon: 'rocket' },
  GUARDIAN: { title: 'Guardian', minStake: 100, minEarnings: 2000, color: 'purple', weeklyBonus: 20, icon: 'shield' },
  SOVEREIGN: { title: 'Sovereign', minStake: 500, minEarnings: 10000, color: 'yellow', weeklyBonus: 50, icon: 'crown' },
  CELESTIAL: { title: 'Celestial', minStake: 1000, minEarnings: 25000, color: 'cyan', weeklyBonus: 100, icon: 'star' },
  LEGENDARY: { title: 'Legendary', minStake: 20000, minEarnings: 500000, color: 'red', weeklyBonus: 200, icon: 'star' },
  SUPERNOVA: { title: 'Supernova', minStake: 50000, minEarnings: 1000000, color: 'red', weeklyBonus: 200, icon: 'star' }
};

export const EARNING_LIMITS = {
  daily_roi_max: 1000,
  referral_commission_max: 500,
  speed_boost_duration: 24 * 60 * 60 * 1000, // 24 hours
  minimum_withdrawal: 1
};

const WITHDRAWAL_FEES = {
  GLP: 0.10,  // 10% to Global Leadership Pool
  STK: 0.10,  // 10% to Reputation Points ($STK)
  REINVEST: 0.20  // 20% to re-investment wallet
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getRankBonus = (rank: string): number => {
  switch (rank) {
    case 'GUARDIAN': return 0.1; // +10%
    case 'SOVEREIGN': return 0.15; // +15%
    case 'CELESTIAL': return 0.2; // +20%
    default: return 0;
  }
};

export const calculateDailyROI = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return STAKING_CONFIG.DAILY_RATES.WEEK1;
  else if (daysDiff <= 14) return STAKING_CONFIG.DAILY_RATES.WEEK2;
  else if (daysDiff <= 21) return STAKING_CONFIG.DAILY_RATES.WEEK3;
  else return STAKING_CONFIG.DAILY_RATES.WEEK4;
};

// Helper function to calculate GLP points
const calculateGLPPoints = (teamVolume: number, withdrawalVolume: number): number => {
  // Points from team volume (1 point per 1000 TON)
  const volumePoints = Math.floor(teamVolume / 1000);
  // Points from withdrawal volume (2% consideration)
  const withdrawalPoints = Math.floor((withdrawalVolume * 0.02) / 100);
  
  // Bonus points for high team volume
  let bonusPoints = 0;
  if (teamVolume >= 10000) bonusPoints += 20;
  if (teamVolume >= 50000) bonusPoints += 50;
  if (teamVolume >= 100000) bonusPoints += 100;
  
  return volumePoints + withdrawalPoints + bonusPoints;
};

// ==========================================
// CORE LOGIC FUNCTIONS
// ==========================================

// Function to calculate user's rank
export const calculateUserRank = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select(`total_earned, balance`)
      .eq('id', userId)
      .single();

    if (!user) return 'NOVICE';

    for (const [rank, requirements] of Object.entries(RANK_REQUIREMENTS).reverse()) {
      if (
        user.balance >= requirements.minStake &&
        user.total_earned >= requirements.minEarnings
      ) {
        return rank;
      }
    }
    return 'NOVICE';
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 'NOVICE';
  }
};

// Function to process weekly rank bonus
const processWeeklyRankBonus = async (userId: number, bonusAmount: number) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastBonus } = await supabase
      .from('rank_bonuses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())
      .single();

    if (lastBonus) return false;

    const { error } = await supabase
      .from('rank_bonuses')
      .insert({
        user_id: userId,
        amount: bonusAmount,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    await supabase
      .from('users')
      .update({
        available_earnings: supabase.rpc('increment', { amount: bonusAmount }),
        total_earned: supabase.rpc('increment', { amount: bonusAmount })
      })
      .eq('id', userId);

    return true;
  } catch (error) {
    console.error('Error processing rank bonus:', error);
    return false;
  }
};

export const updateUserRank = async (userId: number) => {
  try {
    const newRank = await calculateUserRank(userId);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        rank: newRank,
        rank_updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    const rankReq = RANK_REQUIREMENTS[newRank as keyof typeof RANK_REQUIREMENTS];
    if (rankReq.weeklyBonus > 0) {
      await processWeeklyRankBonus(userId, rankReq.weeklyBonus);
    }
    return newRank;
  } catch (error) {
    console.error('Error updating rank:', error);
    return null;
  }
};

// ==========================================
// DATABASE HELPER FUNCTIONS
// ==========================================

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
};

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      rank: 'NOVICE',
      balance: 0,
      total_deposit: 0,
      total_withdrawn: 0,
      team_volume: 0
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
};

export const getActiveStakes = async (userId: number): Promise<Stake[]> => {
  const { data, error } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching stakes:', error);
    return [];
  }
  return data || [];
};

export const createStake = async (stakeData: Partial<Stake>): Promise<Stake | null> => {
  try {
    console.log('Creating stake with data:', stakeData);
    
    const { data, error } = await supabase
      .from('stakes')
      .insert([stakeData])
      .select()
      .single();

    if (error) {
      console.error('Error creating stake:', error);
      return null;
    }
    
    console.log('Stake created successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception creating stake:', error);
    return null;
  }
};

export const createDeposit = async (depositData: Partial<Deposit>): Promise<Deposit | null> => {
  const { data, error } = await supabase
    .from('deposits')
    .insert([depositData])
    .select()
    .single();

  if (error) {
    console.error('Error creating deposit:', error);
    return null;
  }
  return data;
};

export const createWithdrawal = async (withdrawalData: Partial<Withdrawal>): Promise<Withdrawal | null> => {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert([withdrawalData])
    .select()
    .single();

  if (error) {
    console.error('Error creating withdrawal:', error);
    return null;
  }
  return data;
};

export const updateUserBalance = async (userId: number, amount: number, earnedAmount: number): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ 
      balance: amount,
      total_earned: supabase.rpc('increment_total_earned', { amount: earnedAmount })
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating balance:', error);
    return false;
  }
  return true;
};

export const setupStoredProcedures = async (userId: number) => {
  const { error: referralError } = await supabase.rpc('process_referral_v2', {
    p_sponsor_id: userId,
    p_referred_id: userId
  });

  const { error: volumeError } = await supabase.rpc('update_team_volumes', {
    p_sponsor_ids: [userId],
    p_amount: 0
  });

  return !referralError && !volumeError;
};

// ==========================================
// EARNINGS & REWARDS
// ==========================================

export const checkClaimEligibility = async (userId: number): Promise<{
  canClaim: boolean;
  totalClaimable: number;
  nextClaimTime: Date | null;
  timeUntilNextClaim: string;
  eligibleStakes: number;
  totalStakes: number;
}> => {
  try {
    const stakes = await getActiveStakes(userId);
    let totalClaimable = 0;
    let eligibleStakes = 0;
    let earliestNextClaim: Date | null = null;
    
    const now = new Date();
    
    for (const stake of stakes) {
      const lastPayout = new Date(stake.last_payout);
      const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60);
      
      console.log(`Stake ${stake.id}: Hours since last payout: ${hoursSinceLastPayout.toFixed(2)}`);
      
      if (hoursSinceLastPayout >= 24) {
        // This stake is eligible for claiming
        eligibleStakes++;
        
        // Calculate claimable amount for this stake
        const daysSinceStart = Math.floor(
          (now.getTime() - new Date(stake.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let baseDailyROI = 0.01;
        if (stake.amount >= 1000) baseDailyROI = 0.03;
        else if (stake.amount >= 500) baseDailyROI = 0.025;
        else if (stake.amount >= 100) baseDailyROI = 0.02;
        else if (stake.amount >= 50) baseDailyROI = 0.015;
        
        const durationBonus = Math.min(daysSinceStart * 0.0001, 0.005);
        const dailyROI = baseDailyROI + durationBonus;
        const dailyEarning = stake.amount * dailyROI;
        
        const claimableAmount = Math.min(dailyEarning, stake.amount * 0.03);
        totalClaimable += claimableAmount;
        
        console.log(`Stake ${stake.id}: Claimable amount: ${claimableAmount.toFixed(6)} TON`);
      } else {
        // Track when this stake becomes claimable
        const nextClaimForStake = new Date(lastPayout.getTime() + (24 * 60 * 60 * 1000));
        if (!earliestNextClaim || nextClaimForStake < earliestNextClaim) {
          earliestNextClaim = nextClaimForStake;
        }
        
        console.log(`Stake ${stake.id}: Next claim available at: ${nextClaimForStake.toISOString()}`);
      }
    }
    
    let timeUntilNextClaim = '';
    if (earliestNextClaim && totalClaimable === 0) {
      const timeLeft = earliestNextClaim.getTime() - now.getTime();
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        timeUntilNextClaim = `${hours}h ${minutes}m ${seconds}s`;
      }
    }
    
    console.log(`Claim eligibility check: ${eligibleStakes}/${stakes.length} stakes eligible, ${totalClaimable.toFixed(6)} TON claimable`);
    
    return {
      canClaim: totalClaimable > 0,
      totalClaimable,
      nextClaimTime: earliestNextClaim,
      timeUntilNextClaim,
      eligibleStakes,
      totalStakes: stakes.length
    };
  } catch (error) {
    console.error('Error checking claim eligibility:', error);
    return {
      canClaim: false,
      totalClaimable: 0,
      nextClaimTime: null,
      timeUntilNextClaim: '',
      eligibleStakes: 0,
      totalStakes: 0
    };
  }
};

export const calculateDailyRewards = async (stakeId: number): Promise<number> => {
  const { data: stake, error: stakeError } = await supabase
    .from('stakes')
    .select('*, users!inner(*)')
    .eq('id', stakeId)
    .maybeSingle();

  if (stakeError) {
    console.error('Error fetching stake:', stakeError);
    return 0;
  }

  if (!stake || !stake.is_active) {
    console.log(`No active stake found with ID ${stakeId}`);
    return 0;
  }

  const lastPayout = new Date(stake.last_payout);
  const now = new Date();
  const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastPayout < 24) {
    const timeRemaining = 24 - hoursSinceLastPayout;
    console.log(`Stake ${stakeId}: Already paid out in last 24 hours. ${timeRemaining.toFixed(1)} hours remaining until next claim.`);
    return 0;
  }

  // New ROI-based calculation (1-3% daily)
  let baseDailyROI = 0.01; // 1% base daily ROI
  
  // Tier bonuses based on stake amount
  if (stake.amount >= 1000) baseDailyROI = 0.03; // 3% daily for 1000+ TON
  else if (stake.amount >= 500) baseDailyROI = 0.025; // 2.5% daily for 500+ TON
  else if (stake.amount >= 100) baseDailyROI = 0.02; // 2% daily for 100+ TON
  else if (stake.amount >= 50) baseDailyROI = 0.015; // 1.5% daily for 50+ TON
  
  const createdDate = new Date(stake.created_at);
  const daysSinceStart = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Duration bonus (increases over time, up to 0.5% additional)
  const durationBonus = Math.min(daysSinceStart * 0.0001, 0.005); // Up to 0.5% bonus over time
  let dailyROI = baseDailyROI + durationBonus;

  // Apply rank bonus
  const rankBonus = getRankBonus(stake.users.rank);
  dailyROI *= (1 + rankBonus);

  // Calculate daily earning
  let dailyEarning = stake.amount * dailyROI;
  
  // Apply speed boost if user has it (from users table, not stakes)
  if (stake.users.speed_boost_active) {
    dailyEarning *= 1.5;
  }

  // Cap the daily earning to maximum 3% of stake amount
  const maxDailyEarning = Math.min(
    stake.amount * 0.03, // Max 3% daily
    EARNING_LIMITS.daily_roi_max
  );
  
  const cappedEarning = Math.min(dailyEarning, maxDailyEarning);

  console.log(`Stake ${stakeId}: Processing reward of ${cappedEarning.toFixed(6)} TON (${(dailyROI * 100).toFixed(2)}% daily ROI)`);

  const { error } = await supabase
    .from('stakes')
    .update({
      total_earned: stake.total_earned + cappedEarning,
      last_payout: now.toISOString(),
      daily_rate: dailyROI,
      cycle_progress: Math.min(((stake.total_earned + cappedEarning) / stake.amount) * 100, 300)
    })
    .eq('id', stakeId);

  if (error) {
    console.error('Error updating stake rewards:', error);
    return 0;
  }

  await supabase.from('earning_history').insert({
    stake_id: stakeId,
    user_id: stake.user_id,
    amount: cappedEarning,
    type: 'daily_roi',
    roi_rate: dailyROI * 100,
    base_rate: baseDailyROI * 100,
    rank_bonus: rankBonus,
    duration_multiplier: 1 + durationBonus,
    created_at: now.toISOString()
  });

  return cappedEarning;
};

export const checkAndApplySpeedBoost = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('current_deposit, speed_boost_active')
      .eq('id', userId)
      .single();

    if (!user) return false;

    if (user.speed_boost_active) {
      return {
        success: true,
        boosted_amount: user.current_deposit * SPEED_BOOST_MULTIPLIER,
        message: '🚀 Speed boost active: Earning 2x rewards!'
      };
    }

    return {
      success: false,
      boosted_amount: user.current_deposit,
      message: 'Speed boost not active'
    };
  } catch (error) {
    console.error('Error checking speed boost:', error);
    return false;
  }
};

export const getRewardHistory = async (userId: number) => {
  const { data, error } = await supabase
    .from('reward_history')
    .select(`
      *,
      stake:stakes (
        amount,
        daily_rate
      )
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to load reward history:', error);
    throw error;
  }
  return data;
};

export const getGlobalPoolRankings = async (period: string = 'daily') => {
  const { data, error } = await supabase
    .from('global_pool_rankings')
    .select(`
      *,
      user:users (
        username,
        wallet_address
      )
    `)
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching pool data:', error);
    throw error;
  }
  return data;
};

export const getReferralsByPlayer = async (userId: number) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referred_id(username)
      `)
      .eq('sponsor_id', userId);

    if (error) throw error;

    return data?.map(referral => ({
      referred_id: referral.referred_id,
      referred_username: referral.referred?.username || 'Anonymous User'
    })) || [];

  } catch (error) {
    console.error('Error fetching referrals:', error);
    throw error;
  }
};

export const errorRecovery = {
  async retryTransaction(fn: () => Promise<any>, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  },
  async monitorUserActivity(userId: string) {
    return supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        timestamp: new Date().toISOString(),
        action_type: 'system_check',
        status: 'monitoring'
      });
  }
};

export const updateUserSBT = async (userId: number, amount: number, type: 'deposit' | 'referral' | 'stake') => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        total_sbt: supabase.rpc('increment_sbt', { user_id: userId, amount: amount })
      })
      .eq('id', userId)
      .select('total_sbt')
      .single();

    if (error) throw error;

    await supabase.from('sbt_history').insert({
      user_id: userId,
      amount: amount,
      type: type,
      timestamp: new Date().toISOString()
    });

    return user?.total_sbt;
  } catch (error) {
    console.error('Error updating SBT:', error);
    return null;
  }
};

export const generateSponsorCode = (userId: number, username?: string): string => {
  const baseId = userId.toString().padStart(4, '0');
  const usernamePart = username ? username.substring(0, 3).toUpperCase() : 'USR';
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${usernamePart}-${baseId}${randomPart}`.substring(0, 8);
};

export const ensureUserHasSponsorCode = async (userId: number, username?: string): Promise<string> => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('sponsor_code, username')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return '';
    }

    if (user?.sponsor_code) return user.sponsor_code;

    const { data: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
      
    const { data: firstUser } = await supabase
      .from('users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    let sponsorCode: string;
    if (totalUsers?.length === 1 || firstUser?.id === userId) {
      sponsorCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    } else {
      sponsorCode = generateSponsorCode(userId, username || user?.username);
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ sponsor_code: sponsorCode })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating sponsor code:', updateError);
      return '';
    }

    return sponsorCode;
  } catch (error) {
    console.error('Error ensuring sponsor code:', error);
    return '';
  }
};

export const generateDefaultSponsorCode = async (userId: number): Promise<string> => {
  try {
    const defaultCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
    const { error: updateError } = await supabase
      .from('users')
      .update({ sponsor_code: defaultCode })
      .eq('id', userId);

    if (updateError) {
      console.error('Error setting default sponsor code:', updateError);
      return '';
    }
    return defaultCode;
  } catch (error) {
    console.error('Error generating default sponsor code:', error);
    return '';
  }
};

export const processReferralStakingRewards = async (userId: number, stakedAmount: number): Promise<void> => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('sponsor_id, username')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.sponsor_id) {
      console.log('No sponsor found for user:', userId);
      return;
    }

    const rewardAmount = Math.max(1000, stakedAmount * 0.1);

    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id: user.sponsor_id,
      amount: rewardAmount
    });

    if (balanceError) {
      console.error('Error updating sponsor balance:', balanceError);
      return;
    }

    const { error: earningsError } = await supabase.rpc('update_user_earnings', {
      user_id: user.sponsor_id,
      referral_amount: rewardAmount
    });

    if (earningsError) {
      console.error('Error updating sponsor earnings:', earningsError);
    }

    await supabase.from('activities').insert({
      user_id: user.sponsor_id,
      type: 'referral_staking_reward',
      amount: rewardAmount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    await supabase
      .from('referrals')
      .update({ status: 'active' })
      .eq('sponsor_id', user.sponsor_id)
      .eq('referred_id', userId);

    console.log(`Processed referral staking reward: ${rewardAmount} RZC for sponsor ${user.sponsor_id} from user ${userId}'s stake of ${stakedAmount}`);

  } catch (error) {
    console.error('Error processing referral staking rewards:', error);
  }
};

export const logEarningEvent = async (userId: number, type: 'roi' | 'referral' | 'bonus', amount: number, metadata: any) => {
  await supabase.from('earning_logs').insert({
    user_id: userId,
    type,
    amount,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const reconcileEarnings = async (userId: number) => {
  const { data: earnings } = await supabase
    .from('earning_logs')
    .select('amount')
    .eq('user_id', userId);

  const calculatedTotal = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const { data: user } = await supabase
    .from('users')
    .select('total_earned')
    .eq('id', userId)
    .single();

  if (user && Math.abs(calculatedTotal - user.total_earned) > 0.000001) {
    await supabase.from('earning_discrepancies').insert({
      user_id: userId,
      calculated: calculatedTotal,
      recorded: user.total_earned,
      timestamp: new Date().toISOString()
    });
  }
};

// Cycle completion handling
const handleCycleCompletion = async (userId: number, stakeId: number, stakeAmount: number) => {
  try {
    await supabase
      .from('stakes')
      .update({ 
        is_active: false, 
        cycle_completed: true,
        cycle_completed_at: new Date().toISOString()
      })
      .eq('id', stakeId);

    const reinvestAmount = stakeAmount * 0.2;
    const glpAmount = stakeAmount * 0.1;
    const stkAmount = stakeAmount * 0.1;

    await Promise.all([
      supabase.rpc('increment_reinvestment_balance', { user_id: userId, amount: reinvestAmount }),
      supabase.rpc('increment_glp_pool', { p_amount: glpAmount }),
      supabase.rpc('increment_sbt', { user_id: userId, amount: stkAmount })
    ]);

    await supabase.from('cycle_completions').insert({
      user_id: userId,
      stake_id: stakeId,
      stake_amount: stakeAmount,
      reinvest_amount: reinvestAmount,
      glp_amount: glpAmount,
      stk_amount: stkAmount,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling cycle completion:', error);
    throw error;
  }
};

export const processEarnings = async (userId: number, stakeId: number, amount: number, type: 'roi' | 'referral' | 'bonus' = 'roi') => {
  try {
    const timestamp = new Date().toISOString();
    
    const { data: stake } = await supabase
      .from('stakes')
      .select('amount, total_earned')
      .eq('id', stakeId)
      .maybeSingle();

    if (!stake) return false;

    const newTotalEarned = stake.total_earned + amount;
    const cycleProgress = (newTotalEarned / stake.amount) * 100;

    if (cycleProgress >= 300) {
      await handleCycleCompletion(userId, stakeId, stake.amount);
      return true;
    }

    const { error } = await supabase.rpc('process_earnings', {
      p_amount: amount,
      p_stake_id: stakeId,
      p_timestamp: timestamp,
      p_user_id: userId,
      p_type: type
    });

    if (error) throw error;

    await supabase
      .from('stakes')
      .update({ 
        cycle_progress: cycleProgress,
        total_earned: newTotalEarned
      })
      .eq('id', stakeId);

    await logEarningEvent(userId, type, amount, {
      stakeId,
      timestamp,
      cycleProgress
    });

    return true;
  } catch (error) {
    console.error('Error processing earnings:', error);
    return false;
  }
};

export const gmpSystem = {
  getPoolStats: async () => {
    const { data, error } = await supabase.rpc('get_gmp_stats', {
      withdrawal_fee_percent: 10,
      distribution_percent: 35
    });
    
    if (error) throw error;
    return data;
  },

  getUserPoolShare: async (userId: number) => {
    const { data, error } = await supabase.rpc('calculate_user_glp_share', {
      p_user_id: userId,
      p_team_volume_percent: 2,
      p_reset_interval_days: 7
    });

    if (error) throw error;
    return data;
  }
};

export const checkAndHandleCycle = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = stake.total_earned / stake.amount * 100;
    if (totalReturn >= 300) {
      await supabase.rpc('complete_stake_cycle', { 
        p_stake_id: stake.id,
        p_user_id: userId 
      });
    }
  }
};

// ==========================================
// WITHDRAWALS
// ==========================================

export const processWithdrawalFees = async (userId: number, amount: number) => {
  try {
    const glpAmount = amount * WITHDRAWAL_FEES.GLP;
    const stkAmount = amount * WITHDRAWAL_FEES.STK;
    const reinvestAmount = amount * WITHDRAWAL_FEES.REINVEST;
    const userAmount = amount - glpAmount - stkAmount - reinvestAmount;

    await supabase.rpc('increment_glp_pool', { p_amount: glpAmount });
    await supabase.rpc('increment_sbt', { user_id: userId, amount: stkAmount });
    await supabase.rpc('increment_reinvestment_balance', { user_id: userId, amount: reinvestAmount });

    return {
      success: true,
      userAmount,
      fees: {
        glp: glpAmount,
        stk: stkAmount,
        reinvest: reinvestAmount
      }
    };
  } catch (error) {
    console.error('Error processing withdrawal fees:', error);
    return { success: false };
  }
};

export const processWithdrawal = async (userId: number, amount: number): Promise<boolean> => {
  try {
    if (amount < EARNING_LIMITS.minimum_withdrawal) {
      console.error('Withdrawal amount below minimum');
      return false;
    }

    const { data: user } = await supabase
      .from('users')
      .select('available_earnings')
      .eq('id', userId)
      .single();

    if (!user || user.available_earnings < amount) {
      console.error('Insufficient available earnings');
      return false;
    }

    const feeResult = await processWithdrawalFees(userId, amount);
    if (!feeResult.success) return false;

    const { error } = await supabase.rpc('process_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_user_amount: feeResult.userAmount,
      p_glp_amount: feeResult?.fees?.glp ?? 0,
      p_stk_amount: feeResult?.fees?.stk ?? 0,
      p_reinvest_amount: feeResult?.fees?.reinvest ?? 0
    });

    if (error) throw error;

    await supabase.from('withdrawals').insert({
      user_id: userId,
      amount: amount,
      user_amount: feeResult.userAmount,
      glp_fee: feeResult?.fees?.glp ?? 0,
      stk_fee: feeResult?.fees?.stk ?? 0,
      reinvest_amount: feeResult?.fees?.reinvest ?? 0,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return false;
  }
};

export const checkCycleCompletion = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = (stake.total_earned / stake.amount) * 100;
    if (totalReturn >= 300) {
      await supabase
        .from('stakes')
        .update({ is_active: false, cycle_completed: true })
        .eq('id', stake.id);
        
      await supabase.rpc('increment_reinvestment_balance', {
        user_id: userId,
        amount: stake.amount * 0.2
      });
    }
  }
};

export const checkWeeklyWithdrawalEligibility = async (userId: number): Promise<{
  canWithdraw: boolean;
  nextWithdrawalDate: Date | null;
  daysUntilWithdrawal: number;
  hasPendingWithdrawal: boolean;
  pendingWithdrawalId?: number;
}> => {
  try {
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from('withdrawals')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) throw pendingError;

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return {
        canWithdraw: false,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: true,
        pendingWithdrawalId: pendingWithdrawals[0].id
      };
    }

    const { data, error } = await supabase
      .from('users')
      .select('last_weekly_withdrawal')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const lastWithdrawal = data?.last_weekly_withdrawal;
    const now = new Date();
    
    if (!lastWithdrawal) {
      return {
        canWithdraw: true,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: false
      };
    }

    const lastWithdrawalDate = new Date(lastWithdrawal);
    const daysSinceWithdrawal = Math.floor((now.getTime() - lastWithdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceWithdrawal >= 7) {
      return {
        canWithdraw: true,
        nextWithdrawalDate: null,
        daysUntilWithdrawal: 0,
        hasPendingWithdrawal: false
      };
    } else {
      const nextDate = new Date(lastWithdrawalDate);
      nextDate.setDate(nextDate.getDate() + 7);
      return {
        canWithdraw: false,
        nextWithdrawalDate: nextDate,
        daysUntilWithdrawal: 7 - daysSinceWithdrawal,
        hasPendingWithdrawal: false
      };
    }
  } catch (error) {
    console.error('Error checking weekly withdrawal eligibility:', error);
    return {
      canWithdraw: false,
      nextWithdrawalDate: null,
      daysUntilWithdrawal: 0,
      hasPendingWithdrawal: false
    };
  }
};

export const processWeeklyWithdrawal = async (userId: number, amount: number, _walletAddress: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const eligibility = await checkWeeklyWithdrawalEligibility(userId);
    if (!eligibility.canWithdraw) {
      if (eligibility.hasPendingWithdrawal) {
        return {
          success: false,
          error: 'You have a pending withdrawal request. Please wait for it to be processed before making another request.'
        };
      } else {
        return {
          success: false,
          error: 'Weekly withdrawal cooldown active. Please wait until next withdrawal date.'
        };
      }
    }

    if (amount < 1) {
      return { success: false, error: 'Minimum withdrawal amount is 1 RZC' };
    }

    const { data: user } = await supabase
      .from('users')
      .select('total_withdrawn')
      .eq('id', userId)
      .single();

    if (!user || user.total_withdrawn < amount) {
      return { success: false, error: 'Insufficient claimable balance' };
    }

    const { error: withdrawError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        wallet_amount: amount,
        status: 'PENDING',
        created_at: new Date().toISOString()
      });

    if (withdrawError) throw withdrawError;

    const { error: updateError } = await supabase.rpc('update_weekly_withdrawal_tracking', {
      user_id_param: userId,
      withdrawal_amount: amount
    });

    if (updateError) {
      console.error('Error updating weekly withdrawal tracking:', updateError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error processing weekly withdrawal:', error);
    return {
      success: false,
      error: error.message || 'Failed to process withdrawal'
    };
  }
};

export const approveWithdrawal = async (withdrawalId: number): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) return { success: false, error: 'Withdrawal not found' };
    if (withdrawal.status !== 'PENDING') return { success: false, error: 'Withdrawal is not pending' };

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'COMPLETED',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    const { error: balanceError } = await supabase.rpc('update_user_balance_after_withdrawal', {
      user_id: withdrawal.user_id,
      withdrawal_amount: withdrawal.amount
    });

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
      await supabase
        .from('withdrawals')
        .update({ status: 'PENDING' })
        .eq('id', withdrawalId);
      
      return { success: false, error: 'Failed to update user balance' };
    }

    await supabase
      .from('activities')
      .insert({
        user_id: withdrawal.user_id,
        type: 'withdrawal',
        amount: withdrawal.amount,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      });

    return { success: true };
  } catch (error: any) {
    console.error('Error approving withdrawal:', error);
    return {
      success: false,
      error: error.message || 'Failed to approve withdrawal'
    };
  }
};

export const rejectWithdrawal = async (withdrawalId: number, _reason?: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'FAILED',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    return {
      success: false,
      error: error.message || 'Failed to reject withdrawal'
    };
  }
};

export const getUserPayoutStats = async (userId: number): Promise<{
  totalPayout: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  lastPayoutDate: string | null;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_user_payout_stats', {
      user_id_param: userId
    });

    if (error) throw error;

    const stats = data?.[0] || {
      total_payout: 0,
      total_withdrawn: 0,
      pending_withdrawals: 0,
      last_payout_date: null
    };

    return {
      totalPayout: Number(stats.total_payout) || 0,
      totalWithdrawn: Number(stats.total_withdrawn) || 0,
      pendingWithdrawals: Number(stats.pending_withdrawals) || 0,
      lastPayoutDate: stats.last_payout_date
    };
  } catch (error: any) {
    console.error('Error getting user payout stats:', error);
    return {
      totalPayout: 0,
      totalWithdrawn: 0,
      pendingWithdrawals: 0,
      lastPayoutDate: null
    };
  }
};

export const getPlatformPayoutStats = async (): Promise<{
  totalPlatformPayouts: number;
  totalPendingWithdrawals: number;
  totalUsersWithPayouts: number;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_platform_payout_stats');

    if (error) throw error;

    const stats = data?.[0] || {
      total_platform_payouts: 0,
      total_pending_withdrawals: 0,
      total_users_with_payouts: 0
    };

    return {
      totalPlatformPayouts: Number(stats.total_platform_payouts) || 0,
      totalPendingWithdrawals: Number(stats.total_pending_withdrawals) || 0,
      totalUsersWithPayouts: Number(stats.total_users_with_payouts) || 0
    };
  } catch (error: any) {
    console.error('Error getting platform payout stats:', error);
    return {
      totalPlatformPayouts: 0,
      totalPendingWithdrawals: 0,
      totalUsersWithPayouts: 0
    };
  }
};

export const distributeGLPRewards = async () => {
  try {
    const { data: poolData } = await supabase
      .from('global_pool')
      .select('amount')
      .single();
    
    if (!poolData?.amount || poolData.amount === 0) {
      console.log('No rewards to distribute');
      return;
    }

    const { data: participants } = await supabase
      .from('users')
      .select(`
        id,
        team_volume,
        withdrawal_volume:withdrawals(sum)
      `)
      .gte('balance', 100);

    if (!participants?.length) {
      console.log('No qualified participants');
      return;
    }

    const participantPoints = participants.map(p => ({
      user_id: p.id,
      team_volume: p.team_volume,
      points: calculateGLPPoints(
        p.team_volume, 
        p.withdrawal_volume?.[0]?.sum || 0
      )
    }));

    const totalPoints = participantPoints.reduce((sum, p) => sum + p.points, 0);
    
    const distributions = participantPoints.map(p => ({
      user_id: p.user_id,
      amount: (p.points / totalPoints) * poolData.amount,
      points: p.points,
      distribution_date: new Date().toISOString()
    }));

    const { error } = await supabase.rpc('process_glp_distribution', {
      p_distributions: distributions,
      p_pool_amount: poolData.amount
    });

    if (error) throw error;

    await supabase.from('glp_distribution_history').insert(
      distributions.map(d => ({
        ...d,
        total_pool_amount: poolData.amount,
        total_participants: participants.length
      }))
    );

    return {
      success: true,
      distributed_amount: poolData.amount,
      participant_count: participants.length
    };

  } catch (error) {
    console.error('Error distributing GLP rewards:', error);
    return {
      success: false,
      error: 'Failed to distribute GLP rewards'
    };
  }
};

export const processDeposit = async (userId: number, amount: number, txHash: string): Promise<boolean> => {
  try {
    const { data: existingDeposit } = await supabase
      .from('deposits')
      .select('id')
      .eq('transaction_hash', txHash)
      .single();

    if (existingDeposit) {
      console.error('Duplicate transaction detected');
      return false;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, total_deposit')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user data:', userError);
      return false;
    }

    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_hash: txHash,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (depositError || !deposit) {
      console.error('Error creating deposit record:', depositError);
      return false;
    }

    const { error: updateError } = await supabase.rpc('update_user_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_deposit_id: deposit.id
    });

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      await supabase
        .from('deposits')
        .update({ status: 'failed' })
        .eq('id', deposit.id);
      return false;
    }

    await processReferralStakingRewards(userId, amount);

    await supabase.from('activities').insert({
      user_id: userId,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      deposit_id: deposit.id
    });

    return true;

  } catch (error) {
    console.error('Error processing deposit:', error);
    return false;
  }
};

export const reconcileUserBalance = async (userId: number): Promise<boolean> => {
  try {
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalDeposits = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
    const correctBalance = totalDeposits - totalWithdrawals;

    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!user) return false;

    if (Math.abs(user.balance - correctBalance) > 0.000001) {
      await supabase.from('balance_discrepancies').insert({
        user_id: userId,
        recorded_balance: user.balance,
        calculated_balance: correctBalance,
        difference: correctBalance - user.balance,
        timestamp: new Date().toISOString()
      });

      await supabase
        .from('users')
        .update({ 
          balance: correctBalance,
          last_balance_check: new Date().toISOString()
        })
        .eq('id', userId);
    }
    return true;
  } catch (error) {
    console.error('Error reconciling balance:', error);
    return false;
  }
};

export const deleteUserProfile = async (userId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Clear localStorage data including earnings
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('lastLogin');
    
    // Clear all mining earnings data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('mining_earnings_') || key === 'mining_offline_queue')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear legacy keys
    localStorage.removeItem('earningsState');
    localStorage.removeItem('totalEarned');

    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
};

// ==========================================
// USER & TRANSACTION FUNCTIONS
// ==========================================

export const createOrUpdateUser = async (
  email: string,
  walletAddress: string,
  username?: string,
  displayName?: string
): Promise<User> => {
  const userData: {
    email: string;
    wallet_address: string;
    updated_at: string;
    username?: string;
    display_name?: string;
  } = {
    email,
    wallet_address: walletAddress,
    updated_at: new Date().toISOString()
  };

  if (username) userData.username = username;
  if (displayName) userData.display_name = displayName;

  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { 
      onConflict: 'wallet_address',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }

  return data;
};

export const getUserByWalletAddress = async (walletAddress: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user by username: ${error.message}`);
  }

  return data;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  return data || [];
};

export const updateUserProfile = async (
  walletAddress: string,
  updates: Partial<Pick<User, 'username' | 'display_name' | 'avatar_url'>>
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
};

export const createTransaction = async (
  fromUserId: string,
  toUserId: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  tokenContract: string,
  tokenSymbol: string,
  chainId: number,
  message?: string,
  thirdwebTransactionId?: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      from_address: fromAddress,
      to_address: toAddress,
      amount,
      token_contract: tokenContract,
      token_symbol: tokenSymbol,
      chain_id: chainId,
      message,
      thirdweb_transaction_id: thirdwebTransactionId,
      status: 'pending'
    })
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data;
};

export const updateTransactionStatus = async (
  transactionId: string,
  status: 'pending' | 'confirmed' | 'failed',
  transactionHash?: string
): Promise<Transaction> => {
  const updates: {
    status: 'pending' | 'confirmed' | 'failed';
    updated_at: string;
    confirmed_at?: string;
    transaction_hash?: string;
  } = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString();
  }

  if (transactionHash) {
    updates.transaction_hash = transactionHash;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update transaction status: ${error.message}`);
  }

  return data;
};

export const updateThirdwebTransactionId = async (
  transactionId: string,
  thirdwebTransactionId: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      thirdweb_transaction_id: thirdwebTransactionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update thirdweb transaction ID: ${error.message}`);
  }

  return data;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user transactions: ${error.message}`);
  }

  return data || [];
};

export const getRecentTransactions = async (limit = 20): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent transactions: ${error.message}`);
  }

  return data || [];
};

export const subscribeToUserTransactions = (
  userId: string,
  callback: (transaction: Transaction) => void
) => {
  return supabase
    .channel('user-transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `or(from_user_id.eq.${userId},to_user_id.eq.${userId})`
      },
      (payload) => {
        callback(payload.new as Transaction);
      }
    )
    .subscribe();
};

// ==========================================
// MINING SYSTEM FUNCTIONS
// ==========================================

export const startMiningSession = async (userId: number): Promise<{
  success: boolean;
  sessionId?: number;
  error?: string;
}> => {
  try {
    const miningCheck = await canUserStartMining(userId);
    if (!miningCheck.canMine) {
      return {
        success: false,
        error: miningCheck.reason || 'Cannot start mining session'
      };
    }

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'mining_start',
        amount: 0,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      sessionId: activity.id
    };
  } catch (error: any) {
    console.error('Error starting mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to start mining session'
    };
  }
};

export const startMiningSessionUnrestricted = async (userId: number): Promise<{
  success: boolean;
  sessionId?: number;
  error?: string;
}> => {
  try {
    const existing = await getActiveMiningSession(userId);
    if (existing) {
      return { success: true, sessionId: existing.id };
    }

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: userId,
        type: 'mining_start',
        amount: 0,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      sessionId: activity.id
    };
  } catch (error: any) {
    console.error('Error starting unrestricted mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to start unrestricted mining session'
    };
  }
};

export const getActiveMiningSession = async (userId: number): Promise<MiningSession | null> => {
  try {
    const { data: miningStarts, error } = await supabase
      .from('activities')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('type', 'mining_start')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!miningStarts || miningStarts.length === 0) return null;

    const startActivity = miningStarts[0];
    const startTime = new Date(startActivity.created_at);
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const { data: miningComplete } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'mining_complete')
      .eq('status', 'completed')
      .gt('created_at', startActivity.created_at)
      .limit(1);

    if (miningComplete && miningComplete.length > 0) return null;

    const now = new Date();
    if (now >= endTime) return null;

    return {
      id: startActivity.id,
      user_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'active',
      rzc_earned: 0,
      created_at: startActivity.created_at
    };
  } catch (error) {
    console.error('Error fetching active mining session:', error);
    return null;
  }
};

export const manualCompleteMiningSession = async (sessionId: number): Promise<{
  success: boolean;
  rzcEarned?: number;
  error?: string;
}> => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;
    if (!session) return { success: false, error: 'Mining session not found' };

    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const rzcEarned = Math.min(elapsedHours * (50 / 24), 50);

    const { error: updateError } = await supabase
      .from('mining_sessions')
      .update({
        status: 'completed',
        rzc_earned: rzcEarned,
        completed_at: endTime.toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    const { error: activityError } = await supabase.from('activities').insert({
      user_id: session.user_id,
      type: 'mining_complete',
      amount: rzcEarned,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) throw activityError;

    return { success: true, rzcEarned };
  } catch (error: any) {
    console.error('Error manually completing mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete mining session'
    };
  }
};

export const completeMiningSession = async (sessionId: number): Promise<{
  success: boolean;
  rzcEarned?: number;
  error?: string;
}> => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;
    if (!session) return { success: false, error: 'Mining session not found' };

    const rzcEarned = 50.0; // Hardcoded reward for auto-completion?

    const { error: updateError } = await supabase
      .from('mining_sessions')
      .update({
        status: 'completed',
        rzc_earned: rzcEarned,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    const { error: activityError } = await supabase.from('activities').insert({
      user_id: session.user_id,
      type: 'mining_complete',
      amount: rzcEarned,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (activityError) throw activityError;

    return { success: true, rzcEarned };
  } catch (error: any) {
    console.error('Error completing mining session:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete mining session'
    };
  }
};

export const updateMiningProgress = async (sessionId: number, rzcEarned: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('mining_sessions')
      .update({ rzc_earned: rzcEarned })
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating mining progress:', error);
    return false;
  }
};

export const getUserRZCBalance = async (userId: number): Promise<{
  claimableRZC: number;
  totalEarned: number;
  claimedRZC: number;
  lastClaimTime?: string;
}> => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('type, amount, created_at')
      .eq('user_id', userId)
      .in('type', ['rzc_claim', 'mining_complete', 'mining_rig_mk2', 'extended_session'])
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let claimableRZC = 0;
    let totalEarned = 0;
    let claimedRZC = 0;
    let lastClaimTime: string | undefined;

    activities?.forEach(activity => {
      if (activity.type === 'rzc_claim') {
        claimedRZC += activity.amount; // Note: upgrades might have negative amounts
        if (!lastClaimTime && activity.amount > 0) lastClaimTime = activity.created_at;
      } else if (activity.type === 'mining_complete') {
        claimableRZC += activity.amount;
        totalEarned += activity.amount;
      }
    });

    console.log('RZC Balance Calculation:', {
      userId,
      activities: activities?.length || 0,
      claimableRZC,
      totalEarned,
      claimedRZC,
      lastClaimTime
    });

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ available_balance: claimedRZC })
        .eq('id', userId);

      if (updateError) console.error('Error updating available_balance:', updateError);
    } catch (updateErr) {
      console.error('Error updating user available_balance:', updateErr);
    }

    return {
      claimableRZC,
      totalEarned,
      claimedRZC,
      lastClaimTime
    };
  } catch (error) {
    console.error('Error fetching RZC balance:', error);
    return {
      claimableRZC: 0,
      totalEarned: 0,
      claimedRZC: 0
    };
  }
};

export const claimRZCRewards = async (userId: number, amount: number): Promise<{
  success: boolean;
  error?: string;
  transactionId?: string;
}> => {
  try {
    const balance = await getUserRZCBalance(userId);
    
    if (balance.claimableRZC < amount) {
      return { success: false, error: 'Insufficient RZC balance' };
    }

    const { error: claimError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (claimError) throw claimError;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_earned: balance.totalEarned + amount,
        available_balance: balance.claimedRZC + amount,
        last_claim_time: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      transactionId: `RZC-${Date.now()}`
    };
  } catch (error: any) {
    console.error('Error claiming RZC rewards:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim RZC rewards'
    };
  }
};

export const getMiningHistory = async (userId: number, limit: number = 10): Promise<MiningSession[]> => {
  try {
    const { data, error } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching mining history:', error);
    return [];
  }
};

export const processExpiredMiningSessions = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now);

    if (fetchError) throw fetchError;

    for (const session of expiredSessions || []) {
      await completeMiningSession(session.id);
    }
  } catch (error) {
    console.error('Error processing expired mining sessions:', error);
  }
};

export const initializeFreeMiningPeriod = async (userId: number): Promise<{
  success: boolean;
  error?: string;
  freeMiningData?: FreeMiningPeriod;
}> => {
  try {
    const { error: dbError } = await supabase.rpc('initialize_or_update_free_mining_period', {
      p_user_id: userId
    });

    if (dbError) {
      console.error('Database error initializing free mining period:', dbError);
      return {
        success: false,
        error: dbError.message || 'Failed to initialize free mining period'
      };
    }

    const status = await getFreeMiningStatus(userId);
    
    return {
      success: true,
      freeMiningData: {
        user_id: userId,
        start_date: new Date().toISOString(),
        end_date: status.endDate || new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
        grace_period_end: status.gracePeriodEnd || new Date(Date.now() + 107 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: status.isActive,
        sessions_used: status.sessionsUsed,
        max_sessions: status.maxSessions,
        is_in_grace_period: status.isInGracePeriod,
        days_remaining: status.daysRemaining,
        sessions_remaining: status.sessionsRemaining,
        can_mine: status.canMine,
        reason: status.reason || 'Free mining period active'
      }
    };
  } catch (error: any) {
    console.error('Error initializing free mining period:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize free mining period'
    };
  }
};

export const getFreeMiningStatus = async (userId: number): Promise<{
  isActive: boolean;
  daysRemaining: number;
  sessionsUsed: number;
  maxSessions: number;
  sessionsRemaining: number;
  canMine: boolean;
  endDate?: string;
  gracePeriodEnd?: string;
  isInGracePeriod: boolean;
  reason: string;
}> => {
  try {
    const { data, error } = await supabase.rpc('get_free_mining_status', {
      p_user_id: userId
    });

    if (error) {
      console.error('Database error fetching free mining status:', error);
      return {
        isActive: false, daysRemaining: 0, sessionsUsed: 0, maxSessions: 0,
        sessionsRemaining: 0, canMine: false, isInGracePeriod: false,
        reason: 'Error fetching mining status'
      };
    }

    const result = data?.[0];
    if (!result) {
      await initializeFreeMiningPeriod(userId);
      const { data: retryData } = await supabase.rpc('get_free_mining_status', { p_user_id: userId });
      const retryResult = retryData?.[0];
      
      return {
        isActive: retryResult?.is_active || false,
        daysRemaining: retryResult?.days_remaining || 0,
        sessionsUsed: retryResult?.sessions_used || 0,
        maxSessions: retryResult?.max_sessions || 100,
        sessionsRemaining: retryResult?.sessions_remaining || 0,
        canMine: retryResult?.can_mine || false,
        endDate: retryResult?.end_date,
        gracePeriodEnd: retryResult?.grace_period_end,
        isInGracePeriod: retryResult?.is_in_grace_period || false,
        reason: retryResult?.reason || 'Free mining period active'
      };
    }

    return {
      isActive: result.is_active,
      daysRemaining: result.days_remaining,
      sessionsUsed: result.sessions_used,
      maxSessions: result.max_sessions,
      sessionsRemaining: result.sessions_remaining,
      canMine: result.can_mine,
      endDate: result.end_date,
      gracePeriodEnd: result.grace_period_end,
      isInGracePeriod: result.is_in_grace_period,
      reason: result.reason
    };
  } catch (error) {
    console.error('Error fetching free mining status:', error);
    return {
      isActive: false, daysRemaining: 0, sessionsUsed: 0, maxSessions: 0,
      sessionsRemaining: 0, canMine: false, isInGracePeriod: false,
      reason: 'Error fetching mining status'
    };
  }
};

export const updateFreeMiningSessionCount = async (userId: number): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('increment_mining_session_count', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error updating free mining session count:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error updating free mining session count:', error);
    return false;
  }
};

export const canUserStartMining = async (userId: number): Promise<{
  canMine: boolean;
  reason?: string;
  freeMiningStatus?: any;
}> => {
  try {
    const freeMiningStatus = await getFreeMiningStatus(userId);
    
    if (!freeMiningStatus.canMine) {
      return {
        canMine: false,
        reason: freeMiningStatus.reason,
        freeMiningStatus
      };
    }

    const activeSession = await getActiveMiningSession(userId);
    if (activeSession) {
      return {
        canMine: false,
        reason: 'You already have an active mining session.',
        freeMiningStatus
      };
    }

    return {
      canMine: true,
      freeMiningStatus
    };
  } catch (error) {
    console.error('Error checking if user can start mining:', error);
    return {
      canMine: false,
      reason: 'Error checking mining eligibility.'
    };
  }
};

export const recordMiningActivity = async (
  userId: number,
  activityType: 'mining_start' | 'mining_complete' | 'mining_claim',
  amount: number = 0,
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: activityType,
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording mining activity:', error);
    return false;
  }
};

export const recordUpgradeActivity = async (userId: number, cost: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'upgrade_purchase',
      amount: cost,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording upgrade activity:', error);
    return false;
  }
};

export const getPassiveIncomeBoostCost = (level: number): number => {
  // Formula: 100 * 2^(level - 1)
  return 100 * Math.pow(2, level - 1);
};

export const getPassiveIncomeBoostLevel = async (userId: number): Promise<number> => {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('metadata')
      .eq('user_id', userId)
      .eq('type', 'passive_income_boost')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!activities || activities.length === 0) return 0;

    const latestActivity = activities[0];
    const level = latestActivity.metadata?.level || 1;
    return typeof level === 'number' ? level : 1;
  } catch (error) {
    console.error('Error getting passive income boost level:', error);
    return 0;
  }
};

export const purchaseUpgrade = async (
  userId: number,
  upgradeType: 'mining_rig_mk2' | 'extended_session' | 'passive_income_boost',
  cost?: number,
  level?: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (upgradeType === 'passive_income_boost') {
      if (level === undefined || level < 1 || level > 10) {
        return { success: false, error: 'Invalid level. Must be between 1 and 10.' };
      }

      const currentLevel = await getPassiveIncomeBoostLevel(userId);
      
      if (level <= currentLevel) {
        return { success: false, error: `You already have level ${currentLevel}. Upgrade to level ${currentLevel + 1} or higher.` };
      }

      const calculatedCost = getPassiveIncomeBoostCost(level);
      const finalCost = cost || calculatedCost;

      const { claimedRZC } = await getUserRZCBalance(userId);
      if (claimedRZC < finalCost) {
        return { success: false, error: 'Insufficient validated RZC balance.' };
      }

      const { error: deductError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: -finalCost,
        status: 'completed',
      });
      if (deductError) throw deductError;

      const { error: balanceUpdateError } = await supabase
        .from('users')
        .update({
          available_balance: claimedRZC - finalCost
        })
        .eq('id', userId);

      if (balanceUpdateError) {
        console.error('Error updating available_balance after passive income boost:', balanceUpdateError);
      }

      const { error: recordError } = await supabase.from('activities').insert({
        user_id: userId,
        type: 'passive_income_boost',
        amount: finalCost,
        status: 'completed',
        metadata: { level: level }
      });

      if (recordError) {
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'rzc_claim',
          amount: finalCost,
          status: 'completed',
        });
        throw recordError;
      }

      return { success: true };
    }

    if (!cost) {
      return { success: false, error: 'Cost is required for this upgrade type.' };
    }

    const { data: existingUpgrade, error: checkError } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', upgradeType)
      .limit(1);

    if (checkError) throw checkError;
    if (existingUpgrade && existingUpgrade.length > 0) {
      return { success: false, error: 'Upgrade already purchased.' };
    }

    const { claimedRZC } = await getUserRZCBalance(userId);
    if (claimedRZC < cost) {
      return { success: false, error: 'Insufficient validated RZC balance.' };
    }

    const { error: deductError } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim', 
      amount: -cost,
      status: 'completed',
    });
    if (deductError) throw deductError;

    const { error: balanceUpdateError } = await supabase
      .from('users')
      .update({
        available_balance: claimedRZC - cost
      })
      .eq('id', userId);

    if (balanceUpdateError) {
      console.error('Error updating available_balance after upgrade purchase:', balanceUpdateError);
    }
    
    const { error: recordError } = await supabase.from('activities').insert({
      user_id: userId,
      type: upgradeType,
      amount: cost,
      status: 'completed',
    });

    if (recordError) {
      console.error(`CRITICAL: Failed to record upgrade activity for ${upgradeType}. Attempting to refund deduction.`);
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'rzc_claim',
        amount: cost,
        status: 'completed',
      });
      throw recordError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error purchasing upgrade:', error);
    return { success: false, error: error.message };
  }
};

export const generatePassiveIncome = async (userId: number): Promise<{ success: boolean; amount?: number; error?: string }> => {
  try {
    const level = await getPassiveIncomeBoostLevel(userId);
    
    if (level === 0) {
      return { success: false, error: 'No passive income boost active.' };
    }

    const amount = 10 * level;

    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'mining_complete',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;

    return { success: true, amount };
  } catch (error: any) {
    console.error('Error generating passive income:', error);
    return { success: false, error: error.message };
  }
};

export const recordRZCClaimActivity = async (userId: number, amount: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from('activities').insert({
      user_id: userId,
      type: 'rzc_claim',
      amount: amount,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording RZC claim activity:', error);
    return false;
  }
};

export const getUserActivities = async (
  userId: number,
  activityTypes?: string[],
  limit: number = 20
): Promise<any[]> => {
  try {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityTypes && activityTypes.length > 0) {
      query = query.in('type', activityTypes);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};

// ==========================================
// WITHDRAWAL SYSTEM FUNCTIONS
// ==========================================

export interface WithdrawalRequest {
  id: string;
  user_id: number;
  amount: number;
  withdrawal_address: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  processed_by?: number;
  tx_hash?: string;
  rejection_reason?: string;
  network_fee: number;
}

export interface WithdrawalStats {
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  total_withdrawn: number;
  daily_requests_today: number;
  available_balance: number;
}

/**
 * Create a new withdrawal request
 */
export const createWithdrawalRequest = async (
  userId: number,
  amount: number,
  withdrawalAddress: string
): Promise<{
  success: boolean;
  requestId?: string;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.rpc('create_withdrawal_request', {
      p_user_id: userId,
      p_amount: amount,
      p_withdrawal_address: withdrawalAddress
    });

    if (error) {
      console.error('Withdrawal request error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create withdrawal request'
      };
    }

    return {
      success: true,
      requestId: data
    };
  } catch (error: any) {
    console.error('Error creating withdrawal request:', error);
    return {
      success: false,
      error: error.message || 'Failed to create withdrawal request'
    };
  }
};

/**
 * Get user's withdrawal statistics
 */
export const getUserWithdrawalStats = async (userId: number): Promise<WithdrawalStats> => {
  try {
    const { data, error } = await supabase.rpc('get_user_withdrawal_stats', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching withdrawal stats:', error);
      return {
        total_requests: 0,
        pending_requests: 0,
        completed_requests: 0,
        total_withdrawn: 0,
        daily_requests_today: 0,
        available_balance: 0
      };
    }

    return data[0] || {
      total_requests: 0,
      pending_requests: 0,
      completed_requests: 0,
      total_withdrawn: 0,
      daily_requests_today: 0,
      available_balance: 0
    };
  } catch (error) {
    console.error('Error getting withdrawal stats:', error);
    return {
      total_requests: 0,
      pending_requests: 0,
      completed_requests: 0,
      total_withdrawn: 0,
      daily_requests_today: 0,
      available_balance: 0
    };
  }
};

/**
 * Get user's withdrawal requests
 */
export const getUserWithdrawalRequests = async (
  userId: number,
  limit: number = 10
): Promise<WithdrawalRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    return [];
  }
};

/**
 * Process withdrawal request (Admin function)
 */
export const processWithdrawalRequest = async (
  requestId: string,
  newStatus: 'processing' | 'completed' | 'rejected',
  txHash?: string,
  rejectionReason?: string,
  processedBy?: number
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { error } = await supabase.rpc('process_withdrawal_request', {
      p_request_id: requestId,
      p_new_status: newStatus,
      p_tx_hash: txHash,
      p_rejection_reason: rejectionReason,
      p_processed_by: processedBy
    });

    if (error) {
      console.error('Error processing withdrawal request:', error);
      return {
        success: false,
        error: error.message || 'Failed to process withdrawal request'
      };
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error processing withdrawal request:', error);
    return {
      success: false,
      error: error.message || 'Failed to process withdrawal request'
    };
  }
};

/**
 * Get all pending withdrawal requests (Admin function)
 */
export const getPendingWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        user:users(username, wallet_address)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending withdrawals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting pending withdrawals:', error);
    return [];
  }
};

/**
 * Check if user can make a withdrawal request
 */
export const canUserWithdraw = async (userId: number): Promise<{
  canWithdraw: boolean;
  reason?: string;
  availableBalance: number;
  dailyRequestsUsed: number;
  maxDailyRequests: number;
}> => {
  try {
    const stats = await getUserWithdrawalStats(userId);
    const maxDailyRequests = 3;
    const minWithdrawal = 1;

    if (stats.available_balance < minWithdrawal) {
      return {
        canWithdraw: false,
        reason: `Minimum withdrawal amount is ${minWithdrawal} TON`,
        availableBalance: stats.available_balance,
        dailyRequestsUsed: stats.daily_requests_today,
        maxDailyRequests
      };
    }

    if (stats.daily_requests_today >= maxDailyRequests) {
      return {
        canWithdraw: false,
        reason: 'Daily withdrawal limit reached',
        availableBalance: stats.available_balance,
        dailyRequestsUsed: stats.daily_requests_today,
        maxDailyRequests
      };
    }

    return {
      canWithdraw: true,
      availableBalance: stats.available_balance,
      dailyRequestsUsed: stats.daily_requests_today,
      maxDailyRequests
    };
  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error);
    return {
      canWithdraw: false,
      reason: 'Error checking withdrawal eligibility',
      availableBalance: 0,
      dailyRequestsUsed: 0,
      maxDailyRequests: 3
    };
  }
};