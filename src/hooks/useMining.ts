import { useState, useEffect, useCallback, useRef } from 'react';
import { MiningManager } from '@/managers/MiningManager';
import { logger } from '@/utils/logger';

interface UseMiningProps {
  userId: number;
  balance: number;
  isActive?: boolean;
  disabled?: boolean; // Add disabled flag
}

interface MiningStats {
  currentEarnings: number;
  dailyRate: number;
  hourlyRate: number;
  daysStaked: number;
  timeMultiplier: number;
  isActive: boolean;
}

export function useMining({ userId, balance, isActive = true, disabled = false }: UseMiningProps) {
  const [miningStats, setMiningStats] = useState<MiningStats>({
    currentEarnings: 0,
    dailyRate: 0,
    hourlyRate: 0,
    daysStaked: 0,
    timeMultiplier: 1.0,
    isActive: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const miningManagerRef = useRef<MiningManager | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize mining manager
  useEffect(() => {
    if (disabled || !userId || userId === 0) {
      logger.status('Mining disabled or no valid user ID');
      return; // Don't initialize if disabled or userId is 0 or falsy
    }
    
    miningManagerRef.current = new MiningManager(userId);
  }, [userId, disabled]);

  // Update mining when balance changes
  useEffect(() => {
    if (disabled || !miningManagerRef.current || !balance || balance <= 0 || !userId || userId === 0) return;

    const updateMining = async () => {
      try {
        await miningManagerRef.current!.updateMining(balance);
        await refreshMiningStats();
      } catch (err: any) {
        console.error('Failed to update mining:', err);
        setError(err.message || 'Failed to update mining');
      }
    };

    updateMining();
  }, [balance, disabled]);

  // Refresh mining stats from database
  const refreshMiningStats = useCallback(async () => {
    if (!miningManagerRef.current) return;

    try {
      setIsLoading(true);
      const stats = await miningManagerRef.current.getMiningStats();
      setMiningStats(stats);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh mining stats:', err);
      setError(err.message || 'Failed to refresh mining stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start real-time earnings updates
  useEffect(() => {
    if (disabled || !isActive || !miningStats.isActive || miningStats.dailyRate <= 0) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    // Update earnings every second for smooth UI
    updateIntervalRef.current = setInterval(() => {
      setMiningStats(prev => ({
        ...prev,
        currentEarnings: prev.currentEarnings + (prev.dailyRate / 86400) // Add per-second earnings
      }));
    }, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [disabled, isActive, miningStats.isActive, miningStats.dailyRate]);

  // Sync with database periodically
  useEffect(() => {
    if (disabled || !isActive) return;

    const syncInterval = setInterval(() => {
      refreshMiningStats();
    }, 60000); // Sync every minute

    return () => clearInterval(syncInterval);
  }, [disabled, isActive, refreshMiningStats]);

  // Initialize on mount
  useEffect(() => {
    if (!disabled && userId && userId !== 0 && balance > 0) {
      refreshMiningStats();
    }
  }, [disabled, userId, balance, refreshMiningStats]);

  // Claim earnings
  const claimEarnings = useCallback(async () => {
    if (!miningManagerRef.current) {
      throw new Error('Mining manager not initialized');
    }

    try {
      setIsLoading(true);
      const result = await miningManagerRef.current.claimEarnings();
      
      if (result.success) {
        // Refresh stats after successful claim
        await refreshMiningStats();
        return result;
      } else {
        throw new Error(result.error || 'Claim failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim earnings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshMiningStats]);

  // Initialize mining (for new users)
  const initializeMining = useCallback(async (initialBalance: number) => {
    if (!miningManagerRef.current) {
      throw new Error('Mining manager not initialized');
    }

    try {
      setIsLoading(true);
      await miningManagerRef.current.initializeMining(initialBalance);
      await refreshMiningStats();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize mining');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshMiningStats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    miningStats,
    isLoading,
    error,
    
    // Actions
    claimEarnings,
    initializeMining,
    refreshMiningStats,
    clearError,
    
    // Computed values
    isMining: miningStats.isActive && balance > 0,
    canClaim: miningStats.currentEarnings > 0,
    estimatedDailyTON: miningStats.dailyRate,
    estimatedHourlyTON: miningStats.hourlyRate,
    stakingMultiplier: miningStats.timeMultiplier
  };
}