import { supabase, processReferralStakingRewards } from '@/lib/supabaseClient';
import { toNano } from "ton";
import { DepositResult, SyncOperation } from '@/types/depositSync';
import { StateManager } from './StateManager';
import { logger } from '@/utils/logger';

export class TransactionManager {
  private retryQueue: Map<string, SyncOperation> = new Map();
  private depositQueue: Array<{ amount: number; resolve: Function; reject: Function }> = [];
  private isProcessingDeposit = false;
  
  constructor(
    private stateManager: StateManager,
    private tonConnectUI: any,
    private user: any
  ) {}

  async processDeposit(amount: number): Promise<DepositResult> {
    // Queue deposits to prevent race conditions
    return new Promise((resolve, reject) => {
      this.depositQueue.push({ amount, resolve, reject });
      this.processDepositQueue();
    });
  }

  private async processDepositQueue(): Promise<void> {
    if (this.isProcessingDeposit || this.depositQueue.length === 0) {
      return;
    }

    this.isProcessingDeposit = true;

    while (this.depositQueue.length > 0) {
      const { amount, resolve, reject } = this.depositQueue.shift()!;
      
      try {
        const result = await this.executeDeposit(amount);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingDeposit = false;
  }

  private async executeDeposit(amount: number): Promise<DepositResult> {
    try {
      logger.init('Starting deposit process for amount:', amount);
      
      // Validation
      if (amount < 1) {
        throw new Error("Minimum deposit is 1 TON");
      }
      
      if (!this.tonConnectUI.account) {
        throw new Error("Connect wallet first");
      }

      // Generate unique deposit ID
      const depositId = await this.generateUniqueId();
      const amountInNano = toNano(amount.toString());
      
      // Add to pending deposits for UI feedback
      this.stateManager.addPendingDeposit(depositId);
      
      // Get current balance for optimistic update
      const currentBalance = this.user?.balance || 0;
      const newBalance = currentBalance + amount;
      
      // Create pending deposit record
      const { error: pendingError } = await supabase
        .from('deposits')
        .insert([{
          id: depositId,
          user_id: this.user?.id,
          amount: amount,
          amount_nano: amountInNano.toString(),
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (pendingError) throw pendingError;

      // Optimistic balance update (but don't update user object yet to prevent race conditions)
      this.stateManager.updateBalanceOptimistically(newBalance);

      // Create transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 20,
        messages: [{
          address: this.getDepositAddress(),
          amount: amountInNano.toString()
        }]
      };

      logger.update('Sending transaction to wallet...');
      const result = await this.tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        logger.success('Transaction sent successfully:', result.boc);
        await this.confirmTransaction(result.boc, depositId);
        
        return {
          success: true,
          depositId,
          txHash: result.boc,
          newBalance
        };
      } else {
        throw new Error('Transaction was cancelled or failed');
      }

    } catch (error: any) {
      console.error('❌ Deposit failed:', error);
      
      // Revert optimistic update on failure
      if (this.user?.balance) {
        this.stateManager.updateBalanceOptimistically(this.user.balance);
      }
      
      return {
        success: false,
        error: error.message || 'Deposit failed'
      };
    }
  }

  async confirmTransaction(txHash: string, depositId: number): Promise<void> {
    try {
      logger.update('Confirming transaction:', txHash);
      
      // Update deposit status
      await supabase
        .from('deposits')
        .update({ 
          status: 'confirmed', 
          tx_hash: txHash 
        })
        .eq('id', depositId);

      // Get deposit amount for processing
      const depositAmount = await this.getDepositAmount(depositId);

      // Update user balance via RPC function with retry logic
      await this.executeWithRetry(async () => {
        await supabase.rpc('update_user_deposit', {
          p_user_id: this.user?.id,
          p_amount: depositAmount,
          p_deposit_id: depositId
        });
      }, 3);

      // Process referral rewards with retry logic
      await this.executeWithRetry(async () => {
        await processReferralStakingRewards(this.user!.id, depositAmount);
      }, 2);
      
      // Remove from pending deposits
      this.stateManager.removePendingDeposit(depositId);
      
      // Force refresh user data with retry logic
      await this.executeWithRetry(async () => {
        await this.stateManager.refreshUserData();
      }, 3);
      
      logger.success('Transaction confirmed successfully');
      
    } catch (error) {
      console.error('❌ Failed to confirm transaction:', error);
      await this.handleDepositFailure(depositId, error as Error);
    }
  }

  // Helper method for retry logic with exponential backoff
  private async executeWithRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        logger.update(`Retry attempt ${attempt + 1}/${maxRetries + 1} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  async handleDepositFailure(depositId: number, error: Error): Promise<void> {
    try {
      // Update deposit status to failed
      await supabase
        .from('deposits')
        .update({ 
          status: 'failed',
          error_message: error.message
        })
        .eq('id', depositId);

      // Remove from pending deposits
      this.stateManager.removePendingDeposit(depositId);
      
      // Queue retry operation
      this.queueRetryOperation({
        id: `deposit-retry-${depositId}`,
        userId: this.user?.id,
        type: 'balance_update',
        data: { depositId, error: error.message },
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      });

    } catch (retryError) {
      console.error('Failed to handle deposit failure:', retryError);
    }
  }

  private async generateUniqueId(): Promise<number> {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      const id = Math.floor(Math.random() * 999999) + 1;
      const { error } = await supabase
        .from('deposits')
        .select('id')
        .eq('id', id)
        .single();
        
      if (error && error.code === 'PGRST116') {
        return id;
      }
      attempts++;
    }
    
    throw new Error('Could not generate unique deposit ID');
  }

  private async getDepositAmount(depositId: number): Promise<number> {
    const { data, error } = await supabase
      .from('deposits')
      .select('amount')
      .eq('id', depositId)
      .single();
      
    if (error) throw error;
    return data.amount;
  }

  private getDepositAddress(): string {
    const isMainnet = false; // From your config
    const MAINNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';
    const TESTNET_DEPOSIT_ADDRESS = 'UQC3NglZSzm_8mrdGixS7OcIC-R53etS4XAuKrk_qq6PjeCi';
    
    return isMainnet ? MAINNET_DEPOSIT_ADDRESS : TESTNET_DEPOSIT_ADDRESS;
  }

  private queueRetryOperation(operation: SyncOperation): void {
    this.retryQueue.set(operation.id, operation);
    this.processRetryQueue();
  }

  private async processRetryQueue(): Promise<void> {
    for (const [id, operation] of this.retryQueue.entries()) {
      try {
        if (operation.retryCount >= operation.maxRetries) {
          console.error('Max retries reached for operation:', id);
          this.retryQueue.delete(id);
          continue;
        }

        // Exponential backoff
        const delay = Math.pow(2, operation.retryCount) * 1000;
        
        setTimeout(async () => {
          try {
            await this.executeRetryOperation(operation);
            this.retryQueue.delete(id);
          } catch (error) {
            operation.retryCount++;
            console.error(`Retry ${operation.retryCount} failed for ${id}:`, error);
          }
        }, delay);

      } catch (error) {
        console.error('Error processing retry queue:', error);
      }
    }
  }

  private async executeRetryOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'balance_update':
        await this.stateManager.refreshUserData();
        break;
      default:
        console.warn('Unknown retry operation type:', operation.type);
    }
  }

  // Cleanup
  cleanup(): void {
    this.retryQueue.clear();
    
    // Reject any pending deposits in queue
    while (this.depositQueue.length > 0) {
      const { reject } = this.depositQueue.shift()!;
      reject(new Error('Transaction manager cleanup'));
    }
    
    this.isProcessingDeposit = false;
  }
}