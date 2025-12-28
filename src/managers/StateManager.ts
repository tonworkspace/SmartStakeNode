import { supabase } from '@/lib/supabaseClient';
import { 
  UserBalanceState, 
  ActivityState, 
  RealtimePayload, 
  Activity,
  SyncOperation 
} from '@/types/depositSync';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export class StateManager {
  private balanceState: UserBalanceState | null = null;
  private activityState: ActivityState = {
    activities: [],
    isLoading: false,
    hasMore: true,
    lastFetched: new Date().toISOString()
  };
  
  private balanceSubscription: RealtimeChannel | null = null;
  private activitySubscription: RealtimeChannel | null = null;
  private balanceCallbacks: Set<(state: UserBalanceState) => void> = new Set();
  private activityCallbacks: Set<(state: ActivityState) => void> = new Set();
  private syncQueue: SyncOperation[] = [];
  private isProcessingQueue = false;

  constructor(private userId: number) {}

  // Balance state management
  subscribeToBalanceUpdates(callback: (state: UserBalanceState) => void): () => void {
    this.balanceCallbacks.add(callback);
    
    // Send current state immediately if available
    if (this.balanceState) {
      callback(this.balanceState);
    }
    
    return () => {
      this.balanceCallbacks.delete(callback);
    };
  }

  subscribeToActivityUpdates(callback: (state: ActivityState) => void): () => void {
    this.activityCallbacks.add(callback);
    
    // Send current state immediately
    callback(this.activityState);
    
    return () => {
      this.activityCallbacks.delete(callback);
    };
  }

  // Initialize real-time subscriptions
  async initializeSubscriptions(): Promise<void> {
    await this.subscribeToUserUpdates();
    await this.subscribeToActivities();
  }

  private async subscribeToUserUpdates(): Promise<void> {
    try {
      // Clean up existing subscription
      if (this.balanceSubscription) {
        await supabase.removeChannel(this.balanceSubscription);
      }

      this.balanceSubscription = supabase
        .channel(`user-updates-${this.userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${this.userId}`
          },
          (payload) => this.handleUserUpdate(payload)
        )
        .subscribe();

      logger.success('User balance subscription initialized');
    } catch (error) {
      console.error('❌ Failed to subscribe to user updates:', error);
      this.scheduleRetry('user_subscription');
    }
  }

  private async subscribeToActivities(): Promise<void> {
    try {
      // Clean up existing subscription
      if (this.activitySubscription) {
        await supabase.removeChannel(this.activitySubscription);
      }

      this.activitySubscription = supabase
        .channel(`activities-${this.userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
            filter: `user_id=eq.${this.userId}`
          },
          (payload) => this.handleActivityUpdate(payload)
        )
        .subscribe();

      logger.success('Activity subscription initialized');
    } catch (error) {
      console.error('❌ Failed to subscribe to activities:', error);
      this.scheduleRetry('activity_subscription');
    }
  }

  private handleUserUpdate(payload: RealtimePayload): void {
    logger.update('User update received:', payload);
    
    if (payload.eventType === 'UPDATE' && payload.new) {
      const userData = payload.new;
      
      // Update balance state
      const previousBalance = this.balanceState?.balance || 0;
      this.balanceState = {
        userId: this.userId,
        balance: userData.balance || 0,
        previousBalance,
        lastUpdated: new Date().toISOString(),
        isLoading: false,
        pendingDeposits: this.balanceState?.pendingDeposits || []
      };

      // Notify all subscribers
      this.balanceCallbacks.forEach(callback => {
        try {
          callback(this.balanceState!);
        } catch (error) {
          console.error('Error in balance callback:', error);
        }
      });
    }
  }

  private handleActivityUpdate(payload: RealtimePayload): void {
    logger.activity('Activity update received:', payload);
    
    if (payload.eventType === 'INSERT' && payload.new) {
      const newActivity = payload.new as Activity;
      
      // Validate activity data before processing
      if (!this.validateActivityData(newActivity)) {
        console.warn('❌ Invalid activity data received, skipping:', newActivity);
        return;
      }
      
      // Add to activities list (avoid duplicates)
      const exists = this.activityState.activities.some(a => a.id === newActivity.id);
      if (!exists) {
        // Insert in chronological order (most recent first)
        const updatedActivities = [newActivity, ...this.activityState.activities]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10); // Keep only 10 most recent

        this.activityState = {
          ...this.activityState,
          activities: updatedActivities,
          lastFetched: new Date().toISOString()
        };

        logger.success('New activity added to feed:', newActivity.type, newActivity.amount);

        // Notify all subscribers immediately
        this.activityCallbacks.forEach(callback => {
          try {
            callback(this.activityState);
          } catch (error) {
            console.error('Error in activity callback:', error);
          }
        });
      } else {
        logger.update('Activity already exists in feed, skipping:', newActivity.id);
      }
    }
  }

  // Validate activity data integrity
  private validateActivityData(activity: Activity): boolean {
    // Check required fields
    if (!activity.id || !activity.user_id || !activity.type || !activity.created_at) {
      console.warn('❌ Activity missing required fields:', activity);
      return false;
    }

    // Check amount is a valid number
    if (typeof activity.amount !== 'number' || isNaN(activity.amount)) {
      console.warn('❌ Activity has invalid amount:', activity);
      return false;
    }

    // Check timestamp is valid
    const timestamp = new Date(activity.created_at);
    if (isNaN(timestamp.getTime())) {
      console.warn('❌ Activity has invalid timestamp:', activity);
      return false;
    }

    // Check timestamp is not in the future (with 1 minute tolerance)
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60000);
    if (timestamp > oneMinuteFromNow) {
      console.warn('❌ Activity timestamp is in the future:', activity);
      return false;
    }

    // Check user_id matches current user
    if (activity.user_id !== this.userId.toString()) {
      console.warn('❌ Activity user_id does not match current user:', activity);
      return false;
    }

    return true;
  }

  // Manual data refresh methods
  async refreshUserData(): Promise<void> {
    try {
      logger.update('Refreshing user data for user:', this.userId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) {
        console.error('❌ Database error refreshing user data:', error);
        throw error;
      }

      if (userData) {
        const previousBalance = this.balanceState?.balance || 0;
        const newBalance = userData.balance || 0;
        
        logger.data(`Balance updated: ${previousBalance} → ${newBalance}`);
        
        this.balanceState = {
          userId: this.userId,
          balance: newBalance,
          previousBalance,
          lastUpdated: new Date().toISOString(),
          isLoading: false,
          pendingDeposits: this.balanceState?.pendingDeposits || []
        };

        // Notify subscribers
        this.balanceCallbacks.forEach(callback => {
          try {
            callback(this.balanceState!);
          } catch (error) {
            console.error('Error in balance callback during refresh:', error);
          }
        });
        
        logger.success('User data refreshed successfully');
      } else {
        logger.warn('No user data found for user:', this.userId);
      }
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      
      // Queue for retry if this was a network/connection error
      if (this.isRetryableError(error)) {
        this.queueSyncOperation({
          id: `refresh-${Date.now()}`,
          userId: this.userId,
          type: 'user_refresh',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3
        });
      }
      
      throw error;
    }
  }

  // Helper method to determine if an error is retryable
  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, and temporary database issues are retryable
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_ERROR',
      'PGRST301', // Supabase connection error
      'PGRST116'  // Supabase not found (might be temporary)
    ];
    
    return retryableErrors.some(code => 
      error?.code === code || 
      error?.message?.includes(code) ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('connection')
    );
  }

  async refreshActivities(): Promise<void> {
    try {
      logger.update('Refreshing activities for user:', this.userId);
      
      this.activityState = { ...this.activityState, isLoading: true };
      this.activityCallbacks.forEach(callback => callback(this.activityState));

      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Database error refreshing activities:', error);
        throw error;
      }

      // Validate and filter activities
      const validActivities = (activities || []).filter(activity => 
        this.validateActivityData(activity)
      );

      // Ensure chronological ordering (most recent first)
      const sortedActivities = validActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      this.activityState = {
        activities: sortedActivities,
        isLoading: false,
        hasMore: sortedActivities.length >= 10,
        lastFetched: new Date().toISOString()
      };

      logger.success(`Refreshed ${sortedActivities.length} activities`);

      // Notify subscribers
      this.activityCallbacks.forEach(callback => {
        try {
          callback(this.activityState);
        } catch (error) {
          console.error('Error in activity callback during refresh:', error);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to refresh activities:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.activityState = { 
        ...this.activityState, 
        isLoading: false, 
        error: errorMessage 
      };
      this.activityCallbacks.forEach(callback => callback(this.activityState));
      
      // Queue for retry if this was a network/connection error
      if (this.isRetryableError(error)) {
        this.queueSyncOperation({
          id: `activity-refresh-${Date.now()}`,
          userId: this.userId,
          type: 'activity_sync',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3
        });
      }
      
      throw error;
    }
  }

  // Optimistic updates
  updateBalanceOptimistically(newBalance: number): void {
    if (this.balanceState) {
      const previousBalance = this.balanceState.balance;
      this.balanceState = {
        ...this.balanceState,
        balance: newBalance,
        previousBalance,
        lastUpdated: new Date().toISOString(),
        isLoading: false
      };

      this.balanceCallbacks.forEach(callback => callback(this.balanceState!));
    }
  }

  addPendingDeposit(depositId: number): void {
    if (this.balanceState) {
      this.balanceState = {
        ...this.balanceState,
        pendingDeposits: [...this.balanceState.pendingDeposits, depositId],
        isLoading: true
      };

      this.balanceCallbacks.forEach(callback => callback(this.balanceState!));
    }
  }

  removePendingDeposit(depositId: number): void {
    if (this.balanceState) {
      this.balanceState = {
        ...this.balanceState,
        pendingDeposits: this.balanceState.pendingDeposits.filter(id => id !== depositId),
        isLoading: this.balanceState.pendingDeposits.length > 1
      };

      this.balanceCallbacks.forEach(callback => callback(this.balanceState!));
    }
  }

  // Queue management for offline operations
  private queueSyncOperation(operation: SyncOperation): void {
    this.syncQueue.push(operation);
    if (!this.isProcessingQueue) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift()!;
      
      try {
        await this.executeSyncOperation(operation);
      } catch (error) {
        console.error('Sync operation failed:', error);
        
        if (operation.retryCount < operation.maxRetries) {
          operation.retryCount++;
          // Exponential backoff
          const delay = Math.pow(2, operation.retryCount) * 1000;
          setTimeout(() => {
            this.syncQueue.unshift(operation);
            this.processSyncQueue();
          }, delay);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'user_refresh':
        await this.refreshUserData();
        break;
      case 'activity_sync':
        await this.refreshActivities();
        break;
      default:
        console.warn('Unknown sync operation type:', operation.type);
    }
  }

  private scheduleRetry(type: string): void {
    setTimeout(() => {
      if (type === 'user_subscription') {
        this.subscribeToUserUpdates();
      } else if (type === 'activity_subscription') {
        this.subscribeToActivities();
      }
    }, 5000); // Retry after 5 seconds
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.balanceSubscription) {
      await supabase.removeChannel(this.balanceSubscription);
    }
    if (this.activitySubscription) {
      await supabase.removeChannel(this.activitySubscription);
    }
    
    this.balanceCallbacks.clear();
    this.activityCallbacks.clear();
    this.syncQueue = [];
  }
}