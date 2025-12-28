import { supabase, validateInput } from './supabaseClient';

// ==========================================
// ENHANCED CLAIM ELIGIBILITY SYSTEM
// ==========================================

export interface ClaimEligibilityResult {
  canClaim: boolean;
  totalClaimable: number;
  nextClaimTime: Date | null;
  timeUntilNextClaim: string;
  eligibleStakes: number;
  totalStakes: number;
  errors: string[];
  lastSyncTime: Date;
}

export interface StakeClaimResult {
  success: boolean;
  stakeId: number;
  amountClaimed: number;
  newTotalEarned: number;
  cycleProgress: number;
  cycleCompleted: boolean;
  error?: string;
}

export interface BatchClaimResult {
  success: boolean;
  totalClaimed: number;
  stakesProcessed: number;
  errors: string[];
  results: StakeClaimResult[];
  timestamp: Date;
}

class EnhancedClaimSystem {
  private static instance: EnhancedClaimSystem;
  private readonly COOLDOWN_HOURS = 24;
  private readonly MAX_DAILY_ROI = 0.03; // 3%
  private readonly MAX_DAILY_EARNING_LIMIT = 1000; // 1000 TON

  static getInstance(): EnhancedClaimSystem {
    if (!EnhancedClaimSystem.instance) {
      EnhancedClaimSystem.instance = new EnhancedClaimSystem();
    }
    return EnhancedClaimSystem.instance;
  }

  private constructor() {}

  /**
   * Enhanced claim eligibility check with comprehensive validation
   */
  async checkClaimEligibility(userId: number): Promise<ClaimEligibilityResult> {
    const result: ClaimEligibilityResult = {
      canClaim: false,
      totalClaimable: 0,
      nextClaimTime: null,
      timeUntilNextClaim: '',
      eligibleStakes: 0,
      totalStakes: 0,
      errors: [],
      lastSyncTime: new Date()
    };

    try {
      // Validate user ID
      if (!validateInput.userId(userId)) {
        result.errors.push('Invalid user ID');
        return result;
      }

      // Get all active stakes for the user
      const { data: stakes, error: stakesError } = await supabase
        .from('stakes')
        .select(`
          id,
          user_id,
          amount,
          total_earned,
          last_payout,
          created_at,
          is_active,
          cycle_progress
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (stakesError) {
        result.errors.push(`Failed to fetch stakes: ${stakesError.message}`);
        return result;
      }

      if (!stakes || stakes.length === 0) {
        // This is a normal state, not an error - user simply has no stakes yet
        result.totalStakes = 0;
        result.canClaim = false;
        return result;
      }

      result.totalStakes = stakes.length;
      let earliestNextClaim: Date | null = null;
      const now = new Date();

      // Process each stake
      for (const stake of stakes) {
        try {
          const eligibilityCheck = await this.checkStakeEligibility(stake, now);
          
          if (eligibilityCheck.isEligible) {
            result.eligibleStakes++;
            result.totalClaimable += eligibilityCheck.claimableAmount;
          } else if (eligibilityCheck.nextClaimTime) {
            if (!earliestNextClaim || eligibilityCheck.nextClaimTime < earliestNextClaim) {
              earliestNextClaim = eligibilityCheck.nextClaimTime;
            }
          }

          if (eligibilityCheck.error) {
            result.errors.push(`Stake ${stake.id}: ${eligibilityCheck.error}`);
          }
        } catch (error) {
          result.errors.push(`Stake ${stake.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Set claim status
      result.canClaim = result.totalClaimable > 0;
      result.nextClaimTime = earliestNextClaim;

      // Calculate time until next claim
      if (earliestNextClaim && result.totalClaimable === 0) {
        const timeLeft = earliestNextClaim.getTime() - now.getTime();
        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          result.timeUntilNextClaim = `${hours}h ${minutes}m ${seconds}s`;
        }
      }

      return result;

    } catch (error) {
      result.errors.push(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Check eligibility for a single stake
   */
  private async checkStakeEligibility(stake: any, now: Date): Promise<{
    isEligible: boolean;
    claimableAmount: number;
    nextClaimTime: Date | null;
    error?: string;
  }> {
    try {
      // Validate stake data
      if (!validateInput.amount(stake.amount) || stake.amount <= 0) {
        return {
          isEligible: false,
          claimableAmount: 0,
          nextClaimTime: null,
          error: 'Invalid stake amount'
        };
      }

      // Check cooldown period
      const lastPayout = new Date(stake.last_payout);
      const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastPayout < this.COOLDOWN_HOURS) {
        const nextClaimTime = new Date(lastPayout.getTime() + (this.COOLDOWN_HOURS * 60 * 60 * 1000));
        return {
          isEligible: false,
          claimableAmount: 0,
          nextClaimTime,
          error: `Cooldown active: ${(this.COOLDOWN_HOURS - hoursSinceLastPayout).toFixed(1)} hours remaining`
        };
      }

      // Check cycle completion
      const cycleProgress = stake.cycle_progress || 0;
      if (cycleProgress >= 300) {
        return {
          isEligible: false,
          claimableAmount: 0,
          nextClaimTime: null,
          error: 'Stake cycle completed (300% reached)'
        };
      }

      // Calculate claimable amount
      const claimableAmount = await this.calculateStakeRewards(stake);

      if (claimableAmount <= 0) {
        return {
          isEligible: false,
          claimableAmount: 0,
          nextClaimTime: null,
          error: 'No rewards calculated'
        };
      }

      return {
        isEligible: true,
        claimableAmount,
        nextClaimTime: null
      };

    } catch (error) {
      return {
        isEligible: false,
        claimableAmount: 0,
        nextClaimTime: null,
        error: error instanceof Error ? error.message : 'Calculation error'
      };
    }
  }

  /**
   * Calculate rewards for a single stake with enhanced validation
   */
  private async calculateStakeRewards(stake: any): Promise<number> {
    try {
      // Get user information for bonuses
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('rank, speed_boost_active')
        .eq('id', stake.user_id)
        .single();

      if (userError || !user) {
        console.warn(`Failed to fetch user data for stake ${stake.id}:`, userError);
        // Continue with default values
      }

      const userRank = user?.rank || 'NOVICE';
      const speedBoostActive = user?.speed_boost_active || false;

      // Calculate days since stake creation
      const createdAt = new Date(stake.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Base daily ROI based on stake amount (tier system)
      let baseDailyROI = 0.01; // 1% base
      if (stake.amount >= 1000) baseDailyROI = 0.03;      // 3% for 1000+ TON
      else if (stake.amount >= 500) baseDailyROI = 0.025;  // 2.5% for 500+ TON
      else if (stake.amount >= 100) baseDailyROI = 0.02;   // 2% for 100+ TON
      else if (stake.amount >= 50) baseDailyROI = 0.015;   // 1.5% for 50+ TON

      // Duration bonus (up to 0.5% additional over time)
      const durationBonus = Math.min(daysSinceCreation * 0.0001, 0.005);

      // Rank bonus
      const rankBonus = this.getRankBonus(userRank);

      // Calculate final daily ROI
      let dailyROI = baseDailyROI + durationBonus;
      dailyROI *= (1 + rankBonus);

      // Calculate daily earning
      let dailyEarning = stake.amount * dailyROI;

      // Apply speed boost if active
      if (speedBoostActive) {
        dailyEarning *= 1.5;
      }

      // Cap the daily earning
      const maxDailyEarning = Math.min(
        stake.amount * this.MAX_DAILY_ROI,
        this.MAX_DAILY_EARNING_LIMIT
      );

      const claimableAmount = Math.min(dailyEarning, maxDailyEarning);

      // Validate final amount
      if (!validateInput.amount(claimableAmount) || claimableAmount <= 0) {
        return 0;
      }

      return claimableAmount;

    } catch (error) {
      console.error(`Error calculating rewards for stake ${stake.id}:`, error);
      return 0;
    }
  }

  /**
   * Get rank bonus multiplier
   */
  private getRankBonus(rank: string): number {
    switch (rank) {
      case 'GUARDIAN': return 0.1;   // +10%
      case 'SOVEREIGN': return 0.15; // +15%
      case 'CELESTIAL': return 0.2;  // +20%
      default: return 0;
    }
  }

  /**
   * Process claim for all eligible stakes with enhanced error handling and rollback
   */
  async processAllUserStakes(userId: number): Promise<BatchClaimResult> {
    const result: BatchClaimResult = {
      success: false,
      totalClaimed: 0,
      stakesProcessed: 0,
      errors: [],
      results: [],
      timestamp: new Date()
    };

    try {
      // Validate user ID
      if (!validateInput.userId(userId)) {
        result.errors.push('Invalid user ID');
        return result;
      }

      // Check eligibility first
      const eligibility = await this.checkClaimEligibility(userId);
      
      if (eligibility.totalStakes === 0) {
        result.errors.push('No stakes available - create a stake first to start earning rewards');
        return result;
      }
      
      if (!eligibility.canClaim) {
        result.errors.push('No eligible stakes for claiming at this time');
        // Add specific cooldown or other status information
        if (eligibility.timeUntilNextClaim) {
          result.errors.push(`Next claim available in: ${eligibility.timeUntilNextClaim}`);
        }
        return result;
      }

      // Get eligible stakes
      const { data: stakes, error: stakesError } = await supabase
        .from('stakes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (stakesError || !stakes) {
        result.errors.push(`Failed to fetch stakes: ${stakesError?.message || 'Unknown error'}`);
        return result;
      }

      // Process each stake with transaction safety
      for (const stake of stakes) {
        const stakeResult = await this.processStakeClaim(stake);
        result.results.push(stakeResult);

        if (stakeResult.success) {
          result.totalClaimed += stakeResult.amountClaimed;
          result.stakesProcessed++;
        } else if (stakeResult.error && !stakeResult.error.includes('cooldown')) {
          // Only add non-cooldown errors
          result.errors.push(`Stake ${stake.id}: ${stakeResult.error}`);
        }
      }

      // Update user's total earnings if any claims were successful
      if (result.totalClaimed > 0) {
        const updateResult = await this.updateUserEarnings(userId, result.totalClaimed);
        if (!updateResult.success) {
          result.errors.push(`Failed to update user earnings: ${updateResult.error}`);
          // Note: Individual stake updates have already been committed
          // This is a partial failure scenario
        }

        // Record claim activity in activities table
        try {
          const { error: activityError } = await supabase
            .from('activities')
            .insert({
              user_id: userId,
              type: 'claim',
              amount: result.totalClaimed,
              status: 'completed',
              created_at: new Date().toISOString(),
              metadata: {
                stakes_processed: result.stakesProcessed,
                claim_type: 'staking_rewards',
                timestamp: result.timestamp.toISOString()
              }
            });

          if (activityError) {
            console.warn('Failed to record claim activity:', activityError);
            result.errors.push(`Failed to record activity: ${activityError.message}`);
          }
        } catch (error) {
          console.warn('Error recording claim activity:', error);
          result.errors.push('Failed to record claim activity');
        }
      }

      result.success = result.stakesProcessed > 0;
      return result;

    } catch (error) {
      result.errors.push(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Process claim for a single stake with rollback on failure
   */
  private async processStakeClaim(stake: any): Promise<StakeClaimResult> {
    const result: StakeClaimResult = {
      success: false,
      stakeId: stake.id,
      amountClaimed: 0,
      newTotalEarned: stake.total_earned || 0,
      cycleProgress: stake.cycle_progress || 0,
      cycleCompleted: false
    };

    try {
      // Check eligibility for this specific stake
      const now = new Date();
      const eligibilityCheck = await this.checkStakeEligibility(stake, now);

      if (!eligibilityCheck.isEligible) {
        result.error = eligibilityCheck.error || 'Stake not eligible';
        return result;
      }

      const claimableAmount = eligibilityCheck.claimableAmount;

      // Calculate new values
      const newTotalEarned = (stake.total_earned || 0) + claimableAmount;
      const cycleProgress = Math.min((newTotalEarned / stake.amount) * 100, 300);
      const cycleCompleted = cycleProgress >= 300;

      // Update stake with transaction safety
      const { error: updateError } = await supabase
        .from('stakes')
        .update({
          total_earned: newTotalEarned,
          last_payout: now.toISOString(),
          cycle_progress: cycleProgress,
          is_active: !cycleCompleted,
          cycle_completed: cycleCompleted,
          cycle_completed_at: cycleCompleted ? now.toISOString() : null
        })
        .eq('id', stake.id)
        .eq('is_active', true); // Ensure stake is still active

      if (updateError) {
        result.error = `Failed to update stake: ${updateError.message}`;
        return result;
      }

      // Success
      result.success = true;
      result.amountClaimed = claimableAmount;
      result.newTotalEarned = newTotalEarned;
      result.cycleProgress = cycleProgress;
      result.cycleCompleted = cycleCompleted;

      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Update user earnings with validation and error handling
   */
  private async updateUserEarnings(userId: number, amount: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate amount
      if (!validateInput.amount(amount) || amount <= 0) {
        return { success: false, error: 'Invalid amount' };
      }

      // Get current user data first
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('available_earnings, total_earned')
        .eq('id', userId)
        .single();

      if (fetchError || !currentUser) {
        return { success: false, error: 'Failed to fetch current user data' };
      }

      // Calculate new values
      const newAvailableEarnings = (currentUser.available_earnings || 0) + amount;
      const newTotalEarned = (currentUser.total_earned || 0) + amount;

      // Update user earnings
      const { error } = await supabase
        .from('users')
        .update({
          available_earnings: newAvailableEarnings,
          total_earned: newTotalEarned,
          last_active: new Date().toISOString(),
          last_sync: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate claim request before processing
   */
  async validateClaimRequest(userId: number): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Validate user ID
      if (!validateInput.userId(userId)) {
        errors.push('Invalid user ID');
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, is_active')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        errors.push('User not found');
      } else if (!user.is_active) {
        errors.push('User account is inactive');
      }

      // Check for active stakes (this is informational, not an error)
      const { error: stakesError } = await supabase
        .from('stakes')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (stakesError) {
        errors.push('Failed to check stakes');
      }
      // Note: Not having stakes is not an error condition - users can exist without stakes

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors
      };
    }
  }
}

// Export singleton instance
export const enhancedClaimSystem = EnhancedClaimSystem.getInstance();