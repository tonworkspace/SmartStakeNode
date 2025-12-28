import React, { useState, useEffect } from 'react';
import { X, Clock, Coins, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface OfflineEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (amount: number) => void;
}

interface OfflineEarning {
  stake_id: number;
  offline_earnings: number;
  days_offline: number;
  last_calculated: string;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  isOpen,
  onClose,
  onClaim
}) => {
  const { user, updateUserData } = useAuth();
  const [offlineEarnings, setOfflineEarnings] = useState<OfflineEarning[]>([]);
  const [totalOfflineEarnings, setTotalOfflineEarnings] = useState<number>(0);
  const [timeOffline, setTimeOffline] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Load offline earnings when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadOfflineEarnings();
    }
  }, [isOpen, user?.id]);

  const loadOfflineEarnings = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get offline earnings summary
      const { data: summaryData, error: summaryError } = await supabase.rpc('get_offline_earnings_summary', {
        p_user_id: user.id
      });

      if (summaryError) throw summaryError;

      if (summaryData && summaryData.total_pending_earnings > 0) {
        setTotalOfflineEarnings(summaryData.total_pending_earnings);
        
        // Calculate time offline
        const maxDaysOffline = summaryData.max_days_offline || 0;
        if (maxDaysOffline > 0) {
          const days = Math.floor(maxDaysOffline);
          const hours = Math.floor((maxDaysOffline - days) * 24);
          
          if (days > 0) {
            setTimeOffline(`${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours}h` : ''}`);
          } else {
            setTimeOffline(`${hours} hour${hours > 1 ? 's' : ''}`);
          }
        }

        // Get detailed breakdown
        const { data: detailData, error: detailError } = await supabase.rpc('calculate_offline_earnings', {
          p_user_id: user.id
        });

        if (!detailError && detailData) {
          setOfflineEarnings(detailData);
        }
      }
    } catch (error) {
      console.error('Error loading offline earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimOfflineEarnings = async () => {
    if (!user?.id || totalOfflineEarnings <= 0) return;

    setIsClaiming(true);
    try {
      // Process offline earnings
      const { data, error } = await supabase.rpc('process_offline_earnings', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data?.success) {
        // Update user data
        await updateUserData({ id: user.id });
        
        // Call parent callback
        onClaim(data.total_earnings);
        
        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Error claiming offline earnings:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen || totalOfflineEarnings <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-white/90 text-sm">
              Your mining nodes kept working while you were away
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Time Offline */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
              <Clock size={16} />
              <span className="text-sm">You were offline for</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {timeOffline}
            </div>
          </div>

          {/* Earnings Display */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 text-center border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
              Total Offline Earnings
            </div>
            <div className="text-4xl font-black text-green-700 dark:text-green-300 mb-2">
              {totalOfflineEarnings.toFixed(6)}
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              TON
            </div>
          </div>

          {/* Earnings Breakdown */}
          {offlineEarnings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Earnings Breakdown
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {offlineEarnings.map((earning) => (
                  <div
                    key={earning.stake_id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          Stake #{earning.stake_id}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {earning.days_offline} day{earning.days_offline !== 1 ? 's' : ''} offline
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {earning.offline_earnings.toFixed(6)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        TON
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={claimOfflineEarnings}
            disabled={isClaiming || isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClaiming ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <Coins size={20} />
                <span>Claim Offline Earnings</span>
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={12} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Offline Mining</p>
                <p>Your stakes continue earning rewards for up to 7 days while you're offline. Come back regularly to maximize your earnings!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};