import React, { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, Activity, ChevronRight, Sparkles, Lock, Shield } from 'lucide-react';
import { TonPriceDisplay } from './TonPriceDisplay';
import { useAuth } from '@/hooks/useAuth';
import { getActiveStakes, calculateDailyRewards, checkClaimEligibility, Stake, supabase } from '@/lib/supabaseClient';
import { useTonPrice } from '@/hooks/useTonPrice';

interface MarketData {
  smartPrice: number;
}

interface MiningScreenProps {
  stakedAmount: number; // Legacy prop - will be ignored
  claimedAmount: number; // Legacy prop - will be ignored
  startTime: number | null; // Legacy prop - will be ignored
  boostMultiplier: number; // Legacy prop - will be ignored
  onStake: () => void; // Updated to just open modal
  onClaim: (amount: number) => void;
  marketData: MarketData;
  refreshTrigger?: number; // Add optional refresh trigger
}

export const MiningScreen: React.FC<MiningScreenProps> = ({ 
  onStake, 
  onClaim,
  refreshTrigger
}) => {
  const { user, updateUserData } = useAuth();
  const [currentEarnings, setCurrentEarnings] = useState<number>(0);
  const [activeStakes, setActiveStakes] = useState<Stake[]>([]);
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [dailyEarnings, setDailyEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh trigger
  
  // Get real TON price
  const { tonPrice, change24h, isLoading: priceLoading, error: priceError, refreshPrice } = useTonPrice();

  // Enhanced Daily ROI calculation based on stake amount and duration
  const calculateDailyROI = useCallback((amount: number, daysSinceStart: number = 0): number => {
    let baseDailyROI = 0.01; // 1% base daily ROI
    
    // Tier bonuses based on stake amount
    if (amount >= 1000) baseDailyROI = 0.03; // 3% daily for 1000+ TON
    else if (amount >= 500) baseDailyROI = 0.025; // 2.5% daily for 500+ TON
    else if (amount >= 100) baseDailyROI = 0.02; // 2% daily for 100+ TON
    else if (amount >= 50) baseDailyROI = 0.015; // 1.5% daily for 50+ TON
    
    // Duration bonus (increases over time, up to 0.5% additional)
    const durationBonus = Math.min(daysSinceStart * 0.0001, 0.005); // Up to 0.5% bonus over time
    
    return baseDailyROI + durationBonus;
  }, []);

  // Load user's active stakes from database
  const loadActiveStakes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const stakes = await getActiveStakes(user.id);
      setActiveStakes(stakes);
      
      const total = stakes.reduce((sum, stake) => sum + stake.amount, 0);
      setTotalStaked(total);
      
      // Calculate total daily earnings
      let totalDaily = 0;
      stakes.forEach(stake => {
        const daysSinceStart = Math.floor(
          (Date.now() - new Date(stake.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const dailyROI = calculateDailyROI(stake.amount, daysSinceStart);
        totalDaily += stake.amount * dailyROI;
      });
      setDailyEarnings(totalDaily);
      
    } catch (error) {
      console.error('Error loading stakes:', error);
    }
  }, [user?.id, calculateDailyROI]);

  // Check claim eligibility periodically
  const checkEligibility = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // First, check for offline earnings
      const { data: offlineData, error: offlineError } = await supabase.rpc('get_offline_earnings_summary', {
        p_user_id: user.id
      });

      if (!offlineError && offlineData?.total_pending_earnings > 0) {
        console.log(`Found ${offlineData.total_pending_earnings} TON in offline earnings`);
        
        // Process offline earnings automatically
        const { data: processResult, error: processError } = await supabase.rpc('process_offline_earnings', {
          p_user_id: user.id
        });

        if (!processError && processResult?.success) {
          console.log(`Processed offline earnings: ${processResult.total_earnings} TON`);
          
          // Refresh user data after processing offline earnings
          await updateUserData({ id: user.id });
          
          // Show notification about offline earnings
          if (processResult.total_earnings > 0) {
            // You can add a toast notification here
            console.log(`Welcome back! You earned ${processResult.total_earnings} TON while offline.`);
          }
        }
      }

      // Update last_active timestamp
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id);

      // Then check regular eligibility
      const eligibility = await checkClaimEligibility(user.id);
      setCurrentEarnings(eligibility.totalClaimable);
      setNextClaimTime(eligibility.nextClaimTime);
      setTimeUntilNextClaim(eligibility.timeUntilNextClaim);
    } catch (error) {
      console.error('Error checking claim eligibility:', error);
    }
  }, [user?.id, updateUserData]);

  // Real-time earnings calculation with 24-hour claim restriction awareness
  useEffect(() => {
    if (activeStakes.length === 0) {
      setCurrentEarnings(0);
      setNextClaimTime(null);
      setTimeUntilNextClaim('');
      return;
    }

    // Initial check
    checkEligibility();

    // Update every 10 seconds for better performance
    const interval = setInterval(checkEligibility, 10000);

    return () => clearInterval(interval);
  }, [activeStakes, checkEligibility]);

  // Separate timer for countdown display (updates every second)
  useEffect(() => {
    if (!nextClaimTime || currentEarnings > 0) {
      setTimeUntilNextClaim('');
      return;
    }

    const updateCountdown = () => {
      const timeLeft = nextClaimTime.getTime() - Date.now();
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeUntilNextClaim('');
        // Trigger a new eligibility check when countdown reaches zero
        checkEligibility();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextClaimTime, currentEarnings, checkEligibility]);

  // Load stakes on component mount and user change
  useEffect(() => {
    loadActiveStakes();
  }, [loadActiveStakes, refreshKey, refreshTrigger]); // Add refreshTrigger dependency

  // Add periodic refresh to catch new stakes
  useEffect(() => {
    if (!user?.id) return;

    // Refresh stakes every 30 seconds to catch new deposits
    const refreshInterval = setInterval(() => {
      loadActiveStakes();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [user?.id, loadActiveStakes]);

  // Manual refresh function
  const refreshStakes = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    loadActiveStakes();
  }, [loadActiveStakes]);

  // Handle staking - now just calls parent to open modal
  const handleStake = async () => {
    onStake(); // This will open the StakeModal in IndexPage
  };

  const handleClaim = async () => {
    if (!user?.id || currentEarnings <= 0) return;
    
    setIsLoading(true);
    try {
      // Process daily rewards for all active stakes
      let totalClaimed = 0;
      
      for (const stake of activeStakes) {
        const earned = await calculateDailyRewards(stake.id);
        totalClaimed += earned;
      }
      
      if (totalClaimed > 0) {
        // Update user's available earnings in database
        const { error: updateError } = await supabase.rpc('increment_available_earnings', {
          user_id: user.id,
          amount: totalClaimed
        });

        if (updateError) {
          console.error('Error updating user earnings:', updateError);
          // Fallback to direct update
          const { error: fallbackError } = await supabase
            .from('users')
            .update({ 
              available_earnings: (user.available_earnings || 0) + totalClaimed,
              total_earned: (user.total_earned || 0) + totalClaimed
            })
            .eq('id', user.id);
          
          if (fallbackError) {
            console.error('Fallback update also failed:', fallbackError);
            throw fallbackError;
          }
        }

        // Record the claim activity for withdrawal tracking
        await supabase.from('activities').insert({
          user_id: user.id,
          type: 'claim',
          amount: totalClaimed,
          status: 'completed',
          created_at: new Date().toISOString(),
          metadata: {
            stakes_claimed: activeStakes.length,
            claim_type: 'staking_rewards'
          }
        });
        
        // Update local user data
        await updateUserData({
          available_earnings: (user.available_earnings || 0) + totalClaimed,
          total_earned: (user.total_earned || 0) + totalClaimed
        });
        
        // Reset current earnings display
        setCurrentEarnings(0);
        
        // Reload stakes to get updated last_payout times
        await loadActiveStakes();
        
        // Call parent callback
        onClaim(totalClaimed);
      }
      
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isStaking = totalStaked > 0;
  const totalEarned = user?.total_earned || 0;
  
  // Use real TON price instead of mock data
  const realTonPrice = tonPrice;
  const dailyUsdValue = (dailyEarnings * realTonPrice).toFixed(4);
  const currentEarningsUsd = (currentEarnings * realTonPrice).toFixed(2);

  return (
    <div className="flex flex-col items-center space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Protocol Status Badge */}
      <div className="w-full space-y-2 text-center">
        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
          Protocol Yield Terminal
        </h2>
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
            isStaking
              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}>
            <Shield size={12} className={isStaking ? "animate-pulse" : ""} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isStaking ? 'Secure Node Active' : 'Node Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Counter Display */}
       
      <div className="text-center space-y-2 mt-2 sm:mt-4">
         {isStaking && (
            <div className="text-center">
              <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {activeStakes.length} Active Position{activeStakes.length !== 1 ? 's' : ''}
              </div>
              <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                {totalStaked.toFixed(2)} TON Staked
              </div>
            </div>
          )}
        
        {/* Debug refresh button - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={refreshStakes}
            className="text-[8px] text-blue-500 underline"
          >
            Refresh Stakes (Debug)
          </button>
        )}
        
        <span className="text-[9px] sm:text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
          Total Staking Rewards
        </span>
        <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
          <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
            {(totalEarned + currentEarnings).toLocaleString(undefined, { 
              minimumFractionDigits: 6, 
              maximumFractionDigits: 6 
            })}
          </span>
          <span className="text-lg sm:text-xl font-bold text-blue-500">TON</span>
        </div>
        <div className="flex flex-col items-center gap-1">  
          {/* TON Price Display Component */}
          <TonPriceDisplay
            tonPrice={realTonPrice}
            change24h={change24h}
            isLoading={priceLoading}
            error={priceError}
            onRefresh={refreshPrice}
            showEarnings={true}
            dailyEarnings={dailyEarnings}
            dailyUsdValue={dailyUsdValue}
            isStaking={isStaking}
          />
      
        </div>
      </div>

      {/* Main Staking Hub */}
      <div className="relative">
        {isStaking && (
          <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse-ring scale-125 pointer-events-none" />
        )}
        <button
          onClick={handleStake}
          disabled={isLoading}
          className={`relative z-10 w-48 h-48 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center transition-all duration-700 transform active:scale-90 ${
            isStaking 
              ? 'bg-slate-900 dark:bg-slate-800 border-[6px] sm:border-[8px] border-white dark:border-slate-700 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]' 
              : 'bg-white dark:bg-slate-900 border-[6px] sm:border-[8px] border-slate-50 dark:border-white/5 text-slate-200 dark:text-slate-700 shadow-xl shadow-slate-100 dark:shadow-none hover:border-blue-100 dark:hover:border-blue-500/30 hover:text-blue-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Zap 
            size={56} 
            fill={isStaking ? "white" : "none"} 
            className={`mb-1 sm:mb-2 transition-all duration-500 sm:size-[72px] ${
              isStaking ? 'text-blue-400 scale-110' : 'text-slate-100 dark:text-slate-800'
            } ${isLoading ? 'animate-pulse' : ''}`} 
          />
          <span className={`font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] ${
            isStaking ? 'text-white' : 'text-slate-400 dark:text-slate-600'
          }`}>
            {isLoading ? 'Processing...' : isStaking ? 'Staking Active' : 'Start Staking'}
          </span>
          {isStaking && !isLoading && (
            <div className="mt-3 sm:mt-4 px-2 sm:px-3 py-1 bg-white/10 rounded-full text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-white/5 backdrop-blur-sm">
              Earning Rewards
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform relative">
          <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700">
            <Lock size={12} />
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
            <Activity size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">
            Total Staked
          </span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
            {totalStaked.toFixed(2)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">
            TON Locked
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-green-50 dark:group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
            <TrendingUp size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">
            Daily ROI
          </span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
            {totalStaked > 0 ? (calculateDailyROI(totalStaked) * 100).toFixed(1) : '1.0'}%
          </span>
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
            Daily Returns
          </span>
        </div>

        {/* Available Earnings Card */}
        {/* <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
            <DollarSign size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">
            Available
          </span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
            {availableEarnings.toFixed(4)}
          </span>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
            TON Earned
          </span>
        </div> */}

        {/* Real-time Pending */}
        {/* <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 group-hover:text-purple-500 transition-colors">
            <Clock size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">
            Pending
          </span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
            {currentEarnings.toFixed(6)}
          </span>
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest animate-pulse">
            Live Rewards
          </span>
        </div> */}
      </div>

      {/* Enhanced Claim Button - Show for any amount > 0 */}
      {currentEarnings > 0 && (
        <div className="w-full animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={handleClaim}
            disabled={isLoading}
            className={`w-full relative overflow-hidden group bg-slate-900 dark:bg-slate-800 text-white rounded-[28px] sm:rounded-[32px] p-[1px] shadow-2xl transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-slate-900 dark:bg-slate-800 group-hover:bg-transparent rounded-[27px] sm:rounded-[31px] py-4 sm:py-5 flex items-center justify-center gap-3 transition-colors duration-300">
              <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-white group-hover:text-blue-600 transition-all">
                <Sparkles size={16} fill="currentColor" className={`group-hover:scale-110 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400 dark:text-slate-500 group-hover:text-white/80">
                  {isLoading ? 'Processing...' : 'Claim Rewards'}
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
                  {isLoading ? 'Please wait...' : `${currentEarnings.toFixed(6)} TON`}
                </span>
                {!isLoading && (
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                    ≈ ${currentEarningsUsd} USD
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform opacity-40 group-hover:opacity-100" />
            </div>
          </button>
        </div>
      )}

      {/* Countdown Timer for Next Claim */}
      {currentEarnings === 0 && timeUntilNextClaim && isStaking && (
        <div className="w-full animate-in slide-in-from-bottom duration-500">
          <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[28px] sm:rounded-[32px] border border-slate-200 dark:border-slate-700 py-4 sm:py-5 flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
              <Activity size={16} className="animate-pulse" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400 dark:text-slate-500">
                Next Claim Available In
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                {timeUntilNextClaim}
              </span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                24-hour cooldown active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Direct Deposit Button
      {(connectedAddress || isTestMode) && (
        <div className="w-full animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => setIsDepositModalOpen(true)}
            disabled={isLoading}
            className={`w-full relative overflow-hidden group bg-green-900 dark:bg-green-800 text-white rounded-[28px] sm:rounded-[32px] p-[1px] shadow-2xl transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-green-900 dark:bg-green-800 group-hover:bg-transparent rounded-[27px] sm:rounded-[31px] py-4 sm:py-5 flex items-center justify-center gap-3 transition-colors duration-300">
              <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 group-hover:bg-white group-hover:text-green-600 transition-all">
                <Plus size={16} className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400 dark:text-slate-500 group-hover:text-white/80">
                  {isTestMode ? 'Test Deposit' : 'Direct Deposit'}
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
                  {isTestMode ? 'Test Deposit & Stake' : 'Deposit & Stake TON'}
                </span>
              </div>
              <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform opacity-40 group-hover:opacity-100" />
            </div>
          </button>
        </div>
      )} */}

    </div>
  );
};