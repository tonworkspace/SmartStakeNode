import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

export interface MiningState {
  currentEarnings: number;
  earningRate: number; // TON per second
  isActive: boolean;
  lastUpdate: string;
  startDate: string;
  daysStaked: number;
}

export interface MiningConfig {
  baseROI: number; // Daily ROI (e.g., 0.0306 = 3.06%)
  timeMultipliers: {
    [key: string]: number;
  };
  referralBoost: number;
}

export class MiningManager {
  private config: MiningConfig = {
    baseROI: 0.0306, // 3.06% daily
    timeMultipliers: {
      '1-7': 1.0,    // 1-7 days: 1.0x base rate
      '8-30': 1.1,   // 8-30 days: 1.1x bonus multiplier  
      '31+': 1.25    // 31+ days: 1.25x maximum multiplier
    },
    referralBoost: 1.0 // Can be enhanced later
  };

  constructor(private userId: number) {}

  // Calculate time-based multiplier
  private getTimeMultiplier(daysStaked: number): number {
    if (daysStaked <= 7) return this.config.timeMultipliers['1-7'];
    if (daysStaked <= 30) return this.config.timeMultipliers['8-30'];
    return this.config.timeMultipliers['31+'];
  }

  // Calculate earning rate per second
  calculateEarningRate(balance: number, daysStaked: number = 0): number {
    const timeMultiplier = this.getTimeMultiplier(daysStaked);
    const effectiveStakingPower = balance * timeMultiplier * this.config.referralBoost;
    const dailyReward = effectiveStakingPower * this.config.baseROI;
    return dailyReward / 86400; // Convert to per-second rate
  }

  // Get current mining state from database
  async getMiningState(): Promise<MiningState | null> {
    try {
      const { data: userEarnings, error } = await supabase
        .from('user_earnings')
        .select('current_earnings, earning_rate, last_update, start_date')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        console.error('Failed to get mining state:', error);
        return null;
      }

      if (!userEarnings) return null;

      const startDate = new Date(userEarnings.start_date || userEarnings.last_update);
      const now = new Date();
      const daysStaked = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        currentEarnings: Number(userEarnings.current_earnings || 0),
        earningRate: Number(userEarnings.earning_rate || 0),
        isActive: userEarnings.current_earnings !== null,
        lastUpdate: userEarnings.last_update,
        startDate: userEarnings.start_date || userEarnings.last_update,
        daysStaked
      };
    } catch (error) {
      console.error('Error getting mining state:', error);
      return null;
    }
  }

  // Initialize mining for a user (called after first deposit)
  async initializeMining(balance: number): Promise<void> {
    try {
      const earningRate = this.calculateEarningRate(balance, 0);
      const now = new Date().toISOString();

      await supabase
        .from('user_earnings')
        .upsert({
          user_id: this.userId,
          current_earnings: 0,
          earning_rate: earningRate,
          last_update: now,
          start_date: now,
          updated_at: now
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      logger.success(`Mining initialized for user ${this.userId} with rate ${earningRate} TON/sec`);
    } catch (error) {
      console.error('Failed to initialize mining:', error);
      throw error;
    }
  }

  // Update mining state (called when balance changes)
  async updateMining(newBalance: number): Promise<void> {
    try {
      const currentState = await this.getMiningState();
      if (!currentState) {
        // Initialize if no state exists
        await this.initializeMining(newBalance);
        return;
      }

      // Calculate accumulated earnings since last update
      const lastUpdateTime = new Date(currentState.lastUpdate).getTime();
      const now = Date.now();
      const secondsElapsed = (now - lastUpdateTime) / 1000;
      const accumulatedEarnings = currentState.earningRate * secondsElapsed;
      const newCurrentEarnings = currentState.currentEarnings + accumulatedEarnings;

      // Calculate new earning rate based on updated balance and time staked
      const newEarningRate = this.calculateEarningRate(newBalance, currentState.daysStaked);

      await supabase
        .from('user_earnings')
        .update({
          current_earnings: newCurrentEarnings,
          earning_rate: newEarningRate,
          last_update: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString()
        })
        .eq('user_id', this.userId);

      logger.success(`Mining updated for user ${this.userId}: earnings=${newCurrentEarnings.toFixed(6)}, rate=${newEarningRate.toFixed(8)}`);
    } catch (error) {
      console.error('Failed to update mining:', error);
      throw error;
    }
  }

  // Calculate current earnings (without updating database)
  async calculateCurrentEarnings(): Promise<number> {
    const state = await this.getMiningState();
    if (!state) return 0;

    const lastUpdateTime = new Date(state.lastUpdate).getTime();
    const now = Date.now();
    const secondsElapsed = (now - lastUpdateTime) / 1000;
    const accumulatedEarnings = state.earningRate * secondsElapsed;
    
    return state.currentEarnings + accumulatedEarnings;
  }

  // Claim earnings
  async claimEarnings(): Promise<{ success: boolean; amount: number; error?: string }> {
    try {
      const currentEarnings = await this.calculateCurrentEarnings();
      
      if (currentEarnings <= 0) {
        return { success: false, amount: 0, error: 'No earnings to claim' };
      }

      // Reset earnings to 0 and update timestamp
      await supabase
        .from('user_earnings')
        .update({
          current_earnings: 0,
          last_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);

      // Add to user's total earned and SBT balance
      const novaAmount = currentEarnings * 0.1; // 10% as NOVA/SBT tokens
      
      // Get current values first
      const { data: currentUser } = await supabase
        .from('users')
        .select('total_earned, total_sbt, total_withdrawn')
        .eq('id', this.userId)
        .single();
      
      const newTotalEarned = (currentUser?.total_earned || 0) + currentEarnings;
      const newTotalSbt = (currentUser?.total_sbt || 0) + novaAmount;
      const newTotalWithdrawn = (currentUser?.total_withdrawn || 0) + currentEarnings;
      
      await supabase
        .from('users')
        .update({
          total_earned: newTotalEarned,
          total_sbt: newTotalSbt,
          total_withdrawn: newTotalWithdrawn
        })
        .eq('id', this.userId);

      // Create activity record
      await supabase
        .from('activities')
        .insert({
          user_id: this.userId,
          type: 'claim',
          amount: currentEarnings,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      logger.success(`Claimed ${currentEarnings.toFixed(6)} TON + ${novaAmount.toFixed(6)} NOVA for user ${this.userId}`);
      
      return { success: true, amount: currentEarnings };
    } catch (error) {
      console.error('Failed to claim earnings:', error);
      return { success: false, amount: 0, error: (error as Error).message || 'Claim failed' };
    }
  }

  // Get estimated daily earnings
  async getEstimatedDailyEarnings(): Promise<number> {
    const state = await this.getMiningState();
    if (!state) return 0;
    
    return state.earningRate * 86400; // Convert per-second to per-day
  }

  // Get mining statistics
  async getMiningStats(): Promise<{
    currentEarnings: number;
    dailyRate: number;
    hourlyRate: number;
    daysStaked: number;
    timeMultiplier: number;
    isActive: boolean;
  }> {
    const state = await this.getMiningState();
    if (!state) {
      return {
        currentEarnings: 0,
        dailyRate: 0,
        hourlyRate: 0,
        daysStaked: 0,
        timeMultiplier: 1.0,
        isActive: false
      };
    }

    const currentEarnings = await this.calculateCurrentEarnings();
    const dailyRate = state.earningRate * 86400;
    const hourlyRate = state.earningRate * 3600;
    const timeMultiplier = this.getTimeMultiplier(state.daysStaked);

    return {
      currentEarnings,
      dailyRate,
      hourlyRate,
      daysStaked: state.daysStaked,
      timeMultiplier,
      isActive: state.isActive
    };
  }
}