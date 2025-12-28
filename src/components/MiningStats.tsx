import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Target, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface MiningStatsProps {
  totalStaked: number;
  dailyEarnings: number;
  isVisible: boolean;
}

interface StatsData {
  totalEarned: number;
  totalClaimed: number;
  averageDailyROI: number;
  miningDays: number;
  totalStakes: number;
  completedCycles: number;
  bestDailyEarning: number;
  currentStreak: number;
}

export const MiningStats: React.FC<MiningStatsProps> = ({
  totalStaked,
  dailyEarnings,
  isVisible
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalEarned: 0,
    totalClaimed: 0,
    averageDailyROI: 0,
    miningDays: 0,
    totalStakes: 0,
    completedCycles: 0,
    bestDailyEarning: 0,
    currentStreak: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load mining statistics
  useEffect(() => {
    if (isVisible && user?.id) {
      loadMiningStats();
    }
  }, [isVisible, user?.id]);

  const loadMiningStats = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get user's total earned and claimed
      const totalEarned = user.total_earned || 0;
      const totalClaimed = user.available_earnings || 0;

      // Get stakes statistics
      const { data: stakesData, error: stakesError } = await supabase
        .from('stakes')
        .select('*')
        .eq('user_id', user.id);

      if (stakesError) throw stakesError;

      const totalStakes = stakesData?.length || 0;
      const completedCycles = stakesData?.filter(s => s.cycle_completed).length || 0;

      // Get earning history for more detailed stats
      const { data: earningHistory, error: historyError } = await supabase
        .from('earning_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Calculate statistics
      let bestDailyEarning = 0;
      let miningDays = 0;
      let averageDailyROI = 0;

      if (earningHistory && earningHistory.length > 0) {
        // Find best daily earning
        bestDailyEarning = Math.max(...earningHistory.map(h => h.amount));

        // Calculate mining days (unique days with earnings)
        const uniqueDays = new Set(
          earningHistory.map(h => new Date(h.created_at).toDateString())
        );
        miningDays = uniqueDays.size;

        // Calculate average daily ROI
        const totalROI = earningHistory.reduce((sum, h) => sum + (h.roi_rate || 0), 0);
        averageDailyROI = totalROI / earningHistory.length;
      }

      // Calculate current streak (consecutive days with activity)
      const currentStreak = await calculateCurrentStreak();

      setStats({
        totalEarned,
        totalClaimed,
        averageDailyROI,
        miningDays,
        totalStakes,
        completedCycles,
        bestDailyEarning,
        currentStreak
      });

    } catch (error) {
      console.error('Error loading mining stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentStreak = async (): Promise<number> => {
    if (!user?.id) return 0;

    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('created_at')
        .eq('user_id', user.id)
        .in('type', ['claim', 'deposit', 'mining_complete'])
        .order('created_at', { ascending: false })
        .limit(30); // Check last 30 days

      if (error || !activities) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Group activities by date
      const activityDates = new Set(
        activities.map(a => {
          const date = new Date(a.created_at);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      );

      // Count consecutive days from today backwards
      let currentDate = new Date(today);
      while (activityDates.has(currentDate.getTime())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  // const formatDuration = (days: number): string => {
  //   if (days >= 365) {
  //     return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
  //   } else if (days >= 30) {
  //     return `${Math.floor(days / 30)}m ${days % 30}d`;
  //   }
  //   return `${days}d`;
  // };

  if (!isVisible) return null;

  return (
    <div className="w-full space-y-4 animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Mining Statistics
        </h3>
        <button
          onClick={loadMiningStats}
          disabled={isLoading}
          className="text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Earned */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Total Earned
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {formatNumber(stats.totalEarned, 4)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            TON
          </div>
        </div>

        {/* Mining Days */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Mining Days
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.miningDays}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            days active
          </div>
        </div>

        {/* Average ROI */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Avg ROI
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.averageDailyROI.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            daily
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Streak
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.currentStreak}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            days
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Metrics */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            Performance Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Best Daily Earning
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatNumber(stats.bestDailyEarning, 6)} TON
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Total Stakes Created
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {stats.totalStakes}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Completed Cycles
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {stats.completedCycles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Success Rate
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {stats.totalStakes > 0 ? ((stats.completedCycles / stats.totalStakes) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            Current Status
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Active Stakes
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatNumber(totalStaked, 2)} TON
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Daily Earnings
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatNumber(dailyEarnings, 6)} TON
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Available to Claim
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(stats.totalClaimed, 6)} TON
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Mining Efficiency
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min((dailyEarnings / (totalStaked * 0.03)) * 100, 100)}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                  {totalStaked > 0 ? Math.min((dailyEarnings / (totalStaked * 0.03)) * 100, 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-yellow-600 dark:text-yellow-400" />
          <h4 className="font-bold text-sm text-yellow-800 dark:text-yellow-200">
            Achievements
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2 rounded-lg ${stats.miningDays >= 7 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <div className="font-bold">Week Warrior</div>
            <div>Mine for 7 days</div>
          </div>
          <div className={`p-2 rounded-lg ${stats.totalEarned >= 10 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <div className="font-bold">TON Collector</div>
            <div>Earn 10 TON total</div>
          </div>
          <div className={`p-2 rounded-lg ${stats.currentStreak >= 5 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <div className="font-bold">Streak Master</div>
            <div>5-day streak</div>
          </div>
          <div className={`p-2 rounded-lg ${stats.completedCycles >= 1 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <div className="font-bold">Cycle Complete</div>
            <div>Complete 1 cycle</div>
          </div>
        </div>
      </div>
    </div>
  );
};