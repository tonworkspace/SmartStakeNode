import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

interface OfflineEarningsData {
  totalPendingEarnings: number;
  stakesWithEarnings: number;
  maxDaysOffline: number;
  canClaimOffline: boolean;
  checkedAt: string;
}

interface ProcessedEarningsData {
  success: boolean;
  userId: number;
  totalEarnings: number;
  stakesProcessed: number;
  processedAt: string;
}

export const useOfflineEarnings = () => {
  const { user, updateUserData } = useAuth();
  const [offlineEarnings, setOfflineEarnings] = useState<OfflineEarningsData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<ProcessedEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for offline earnings
  const checkOfflineEarnings = useCallback(async () => {
    if (!user?.id) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_offline_earnings_summary', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking offline earnings:', error);
        return null;
      }

      const earningsData: OfflineEarningsData = {
        totalPendingEarnings: data.total_pending_earnings || 0,
        stakesWithEarnings: data.stakes_with_earnings || 0,
        maxDaysOffline: data.max_days_offline || 0,
        canClaimOffline: data.can_claim_offline || false,
        checkedAt: data.checked_at
      };

      setOfflineEarnings(earningsData);
      return earningsData;
    } catch (error) {
      console.error('Exception checking offline earnings:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Process offline earnings
  const processOfflineEarnings = useCallback(async () => {
    if (!user?.id || isProcessing) return null;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('process_offline_earnings', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error processing offline earnings:', error);
        return null;
      }

      const processedData: ProcessedEarningsData = {
        success: data.success || false,
        userId: data.user_id,
        totalEarnings: data.total_earnings || 0,
        stakesProcessed: data.stakes_processed || 0,
        processedAt: data.processed_at
      };

      setLastProcessed(processedData);
      
      // Clear offline earnings since they've been processed
      setOfflineEarnings(null);

      // Update user data to reflect new earnings
      if (processedData.success && processedData.totalEarnings > 0) {
        await updateUserData({ id: user.id });
      }

      // Update last_active timestamp
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id);

      return processedData;
    } catch (error) {
      console.error('Exception processing offline earnings:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, isProcessing, updateUserData]);

  // Auto-check on component mount and user change
  useEffect(() => {
    if (user?.id) {
      checkOfflineEarnings();
    }
  }, [user?.id, checkOfflineEarnings]);

  // Auto-process if offline earnings are detected
  useEffect(() => {
    if (offlineEarnings?.canClaimOffline && offlineEarnings.totalPendingEarnings > 0) {
      // Auto-process offline earnings
      processOfflineEarnings();
    }
  }, [offlineEarnings, processOfflineEarnings]);

  return {
    offlineEarnings,
    lastProcessed,
    isProcessing,
    isLoading,
    checkOfflineEarnings,
    processOfflineEarnings,
    hasOfflineEarnings: offlineEarnings?.canClaimOffline || false,
    offlineAmount: offlineEarnings?.totalPendingEarnings || 0,
    daysOffline: offlineEarnings?.maxDaysOffline || 0
  };
};