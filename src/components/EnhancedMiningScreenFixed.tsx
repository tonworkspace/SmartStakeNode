// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Zap, TrendingUp, Activity, ChevronRight, Sparkles, Lock, Shield, Play, Pause, BarChart3, Rocket } from 'lucide-react';
// import { TonPriceDisplay } from './TonPriceDisplay';
// import { useAuth } from '@/hooks/useAuth';
// import { getActiveStakes, supabase } from '@/lib/supabaseClient';
// import { useTonPrice } from '@/hooks/useTonPrice';

// interface MarketData {
//   smartPrice: number;
// }

// interface EnhancedMiningScreenProps {
//   onStake: () => void;
//   onClaim: (amount: number) => void;
//   marketData: MarketData;
//   refreshTrigger?: number;
//   showSnackbar: (config: { message: string; description?: string }) => void;
// }

// interface Stake {
//   id: number;
//   user_id: number;
//   amount: number;
//   daily_rate: number;
//   total_earned: number;
//   is_active: boolean;
//   last_payout: string;
//   cycle_progress: number;
//   created_at: string;
// }

// export const EnhancedMiningScreen: React.FC<EnhancedMiningScreenProps> = ({ 
//   onStake, 
//   onClaim,
//   refreshTrigger,
//   showSnackbar
// }) => {
//   const { user, updateUserData } = useAuth();
  
//   // Real-time mining state
//   const [currentEarnings, setCurrentEarnings] = useState<number>(0);
//   const [realTimeEarnings, setRealTimeEarnings] = useState<number>(0);
//   const [activeStakes, setActiveStakes] = useState<Stake[]>([]);
//   const [totalStaked, setTotalStaked] = useState<number>(0);
//   const [dailyEarnings, setDailyEarnings] = useState<number>(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isMining, setIsMining] = useState(false);
//   const [miningStartTime, setMiningStartTime] = useState<Date | null>(null);
//   const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
//   const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>('');
  
//   // Animation state
//   const [animationSpeed, setAnimationSpeed] = useState(1);
//   const [showEarningAnimation, setShowEarningAnimation] = useState(false);
//   const [lastEarningIncrement, setLastEarningIncrement] = useState(0);
  
//   // Refs for intervals
//   const miningIntervalRef = useRef<NodeJS.Timeout>();
//   const animationIntervalRef = useRef<NodeJS.Timeout>();
  
//   // Get real TON price
//   const { tonPrice, change24h, isLoading: priceLoading, error: priceError, refreshPrice } = useTonPrice();

//   // Enhanced Daily ROI calculation
//   const calculateDailyROI = useCallback((amount: number, daysSinceStart: number = 0): number => {
//     let baseDailyROI = 0.01; // 1% base daily ROI
    
//     // Tier bonuses based on stake amount
//     if (amount >= 1000) baseDailyROI = 0.03; // 3% daily for 1000+ TON
//     else if (amount >= 500) baseDailyROI = 0.025; // 2.5% daily for 500+ TON
//     else if (amount >= 100) baseDailyROI = 0.02; // 2% daily for 100+ TON
//     else if (amount >= 50) baseDailyROI = 0.015; // 1.5% daily for 50+ TON
    
//     // Duration bonus (increases over time, up to 0.5% additional)
//     const durationBonus = Math.min(daysSinceStart * 0.0001, 0.005);
    
//     return baseDailyROI + durationBonus;
//   }, []);

//   // Check claim eligibility
//   const checkEligibility = useCallback(async () => {
//     if (!user?.id) return;
    
//     try {
//       const { data, error } = await supabase.rpc('get_user_claimable_rewards', {
//         p_user_id: user.id
//       });

//       if (!error && data) {
//         setCurrentEarnings(data.total_claimable || 0);
//         if (data.next_claim_time) {
//           setNextClaimTime(new Date(data.next_claim_time));
//         }
//       }
//     } catch (error) {
//       console.error('Error checking claim eligibility:', error);
//     }
//   }, [user?.id]);

//   // Start the mining animation
//   const startMining = useCallback(() => {
//     if (totalStaked === 0 || isMining) return;
    
//     setIsMining(true);
//     setMiningStartTime(new Date());
    
//     // Calculate earnings per second for smooth animation
//     const earningsPerSecond = dailyEarnings / (24 * 60 * 60);
    
//     // Start real-time counter animation
//     animationIntervalRef.current = setInterval(() => {
//       setRealTimeEarnings(prev => {
//         const increment = earningsPerSecond * animationSpeed;
//         setLastEarningIncrement(increment);
        
//         // Show earning animation every few seconds
//         if (Math.random() < 0.1) {
//           setShowEarningAnimation(true);
//           setTimeout(() => setShowEarningAnimation(false), 1000);
//         }
        
//         return prev + increment;
//       });
//     }, 1000);
    
//   }, [totalStaked, dailyEarnings, isMining, animationSpeed]);

//   // Stop mining
//   const stopMining = useCallback(() => {
//     setIsMining(false);
//     if (animationIntervalRef.current) {
//       clearInterval(animationIntervalRef.current);
//     }
//   }, []);

//   // Toggle mining state
//   const toggleMining = useCallback(() => {
//     if (isMining) {
//       stopMining();
//     } else {
//       startMining();
//     }
//   }, [isMining, startMining, stopMining]);

//   // Load user's active stakes
//   const loadActiveStakes = useCallback(async () => {
//     if (!user?.id) return;
    
//     try {
//       const stakes = await getActiveStakes(user.id);
//       setActiveStakes(stakes);
      
//       const total = stakes.reduce((sum, stake) => sum + stake.amount, 0);
//       setTotalStaked(total);
      
//       // Calculate total daily earnings
//       let totalDaily = 0;
//       stakes.forEach(stake => {
//         const daysSinceStart = Math.floor(
//           (Date.now() - new Date(stake.created_at).getTime()) / (1000 * 60 * 60 * 24)
//         );
//         const dailyROI = calculateDailyROI(stake.amount, daysSinceStart);
//         totalDaily += stake.amount * dailyROI;
//       });
//       setDailyEarnings(totalDaily);
      
//       // Start mining if we have stakes
//       if (stakes.length > 0 && !isMining) {
//         startMining();
//       }
      
//     } catch (error) {
//       console.error('Error loading stakes:', error);
//     }
//   }, [user?.id, calculateDailyROI, isMining, startMining]);

//   // Handle claim
//   const handleClaim = async () => {
//     if (!user?.id || currentEarnings <= 0) return;
    
//     setIsLoading(true);
//     try {
//       // Process all user stakes
//       const { data, error } = await supabase.rpc('process_all_user_stakes', {
//         p_user_id: user.id
//       });

//       if (!error && data?.success && data.total_claimed > 0) {
//         // Update user data
//         await updateUserData({ id: user.id });
        
//         // Reset real-time counter to current claimable amount
//         setRealTimeEarnings(0);
//         setCurrentEarnings(0);
        
//         // Reload stakes
//         await loadActiveStakes();
        
//         // Call parent callback
//         onClaim(data.total_claimed);
//       }
      
//     } catch (error) {
//       console.error('Error claiming rewards:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Countdown timer effect
//   useEffect(() => {
//     if (!nextClaimTime || currentEarnings > 0) {
//       setTimeUntilNextClaim('');
//       return;
//     }

//     const updateCountdown = () => {
//       const timeLeft = nextClaimTime.getTime() - Date.now();
//       if (timeLeft > 0) {
//         const hours = Math.floor(timeLeft / (1000 * 60 * 60));
//         const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
//         const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
//         setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`);
//       } else {
//         setTimeUntilNextClaim('');
//         checkEligibility();
//       }
//     };

//     updateCountdown();
//     const interval = setInterval(updateCountdown, 1000);
//     return () => clearInterval(interval);
//   }, [nextClaimTime, currentEarnings, checkEligibility]);

//   // Load stakes and start mining on mount
//   useEffect(() => {
//     loadActiveStakes();
//   }, [loadActiveStakes, refreshTrigger]);

//   // Check eligibility periodically
//   useEffect(() => {
//     checkEligibility();
//     const interval = setInterval(checkEligibility, 30000); // Every 30 seconds
//     return () => clearInterval(interval);
//   }, [checkEligibility]);

//   // Cleanup intervals on unmount
//   useEffect(() => {
//     return () => {
//       if (miningIntervalRef.current) clearInterval(miningIntervalRef.current);
//       if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
//     };
//   }, []);

//   const totalEarned = user?.total_earned || 0;
//   const totalDisplayEarnings = totalEarned + currentEarnings + realTimeEarnings;
  
//   // Use real TON price
//   const realTonPrice = tonPrice;
//   const dailyUsdValue = (dailyEarnings * realTonPrice).toFixed(4);
//   const currentEarningsUsd = ((currentEarnings + realTimeEarnings) * realTonPrice).toFixed(2);

//   return (
//     <div className="flex flex-col items-center space-y-6 sm:space-y-8 animate-in fade-in duration-700">
//       {/* Protocol Status Badge */}
//       <div className="w-full space-y-2 text-center">
//         <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
//           Protocol Yield Terminal
//         </h2>
//         <div className="flex items-center justify-center gap-3">
//           <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
//             isMining
//               ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-sm'
//               : totalStaked > 0
//               ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400 shadow-sm'
//               : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
//           }`}>
//             <Shield size={12} className={isMining ? "animate-pulse" : ""} />
//             <span className="text-[10px] font-black uppercase tracking-widest">
//               {isMining ? 'Mining Active' : totalStaked > 0 ? 'Mining Paused' : 'Node Offline'}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Enhanced Real-time Counter Display */}
//       <div className="text-center space-y-2 mt-2 sm:mt-4 relative">
//         {totalStaked > 0 && (
//           <div className="text-center">
//             <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//               {activeStakes.length} Active Position{activeStakes.length !== 1 ? 's' : ''}
//             </div>
//             <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
//               {totalStaked.toFixed(2)} TON Staked
//             </div>
//           </div>
//         )}
        
//         <span className="text-[9px] sm:text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
//           Total Mining Rewards
//         </span>
        
//         {/* Animated earnings display */}
//         <div className="relative">
//           <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
//             <span className={`text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none transition-all duration-300 ${
//               isMining ? 'text-green-600 dark:text-green-400' : ''
//             }`}>
//               {totalDisplayEarnings.toLocaleString(undefined, { 
//                 minimumFractionDigits: 6, 
//                 maximumFractionDigits: 6 
//               })}
//             </span>
//             <span className="text-lg sm:text-xl font-bold text-blue-500">TON</span>
//           </div>
          
//           {/* Earning animation */}
//           {showEarningAnimation && (
//             <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
//               <span className="text-sm font-bold text-green-500">
//                 +{lastEarningIncrement.toFixed(8)}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Mining status and controls */}
//         {totalStaked > 0 && (
//           <div className="flex flex-col items-center gap-2">
//             <div className="flex items-center gap-2">
//               <span className={`text-xs font-bold ${isMining ? 'text-green-500' : 'text-yellow-500'}`}>
//                 {isMining ? '⚡ Mining...' : '⏸️ Paused'}
//               </span>
//               {isMining && (
//                 <span className="text-xs text-slate-500">
//                   {((dailyEarnings / (24 * 60 * 60)) * 3600).toFixed(8)} TON/hour
//                 </span>
//               )}
//             </div>
            
//             {/* Mining control button */}
//             <button
//               onClick={toggleMining}
//               className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
//                 isMining 
//                   ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
//                   : 'bg-green-500 hover:bg-green-600 text-white'
//               }`}
//             >
//               {isMining ? (
//                 <>
//                   <Pause size={12} className="inline mr-1" />
//                   Pause Mining
//                 </>
//               ) : (
//                 <>
//                   <Play size={12} className="inline mr-1" />
//                   Start Mining
//                 </>
//               )}
//             </button>
//           </div>
//         )}
        
//         <div className="flex flex-col items-center gap-1">  
//           <TonPriceDisplay
//             tonPrice={realTonPrice}
//             change24h={change24h}
//             isLoading={priceLoading}
//             error={priceError}
//             onRefresh={refreshPrice}
//             showEarnings={true}
//             dailyEarnings={dailyEarnings}
//             dailyUsdValue={dailyUsdValue}
//             isStaking={totalStaked > 0}
//           />
//         </div>
//       </div>

//       {/* Enhanced Mining Hub */}
//       <div className="relative">
//         {isMining && (
//           <div className="absolute inset-0 rounded-full bg-green-400/10 animate-pulse-ring scale-125 pointer-events-none" />
//         )}
//         <button
//           onClick={onStake}
//           disabled={isLoading}
//           className={`relative z-10 w-48 h-48 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center transition-all duration-700 transform active:scale-90 ${
//             totalStaked > 0
//               ? isMining
//                 ? 'bg-green-900 dark:bg-green-800 border-[6px] sm:border-[8px] border-white dark:border-slate-700 shadow-[0_20px_50px_-10px_rgba(34,197,94,0.3)]'
//                 : 'bg-yellow-900 dark:bg-yellow-800 border-[6px] sm:border-[8px] border-white dark:border-slate-700 shadow-[0_20px_50px_-10px_rgba(234,179,8,0.3)]'
//               : 'bg-white dark:bg-slate-900 border-[6px] sm:border-[8px] border-slate-50 dark:border-white/5 text-slate-200 dark:text-slate-700 shadow-xl shadow-slate-100 dark:shadow-none hover:border-blue-100 dark:hover:border-blue-500/30 hover:text-blue-400'
//           } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
//         >
//           <Zap 
//             size={56} 
//             fill={totalStaked > 0 ? "white" : "none"} 
//             className={`mb-1 sm:mb-2 transition-all duration-500 sm:size-[72px] ${
//               totalStaked > 0 
//                 ? isMining 
//                   ? 'text-green-400 scale-110 animate-pulse' 
//                   : 'text-yellow-400 scale-110'
//                 : 'text-slate-100 dark:text-slate-800'
//             } ${isLoading ? 'animate-pulse' : ''}`} 
//           />
//           <span className={`font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] ${
//             totalStaked > 0 ? 'text-white' : 'text-slate-400 dark:text-slate-600'
//           }`}>
//             {isLoading ? 'Processing...' : totalStaked > 0 ? (isMining ? 'Mining Active' : 'Mining Paused') : 'Start Mining'}
//           </span>
//           {totalStaked > 0 && !isLoading && (
//             <div className={`mt-3 sm:mt-4 px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border backdrop-blur-sm ${
//               isMining 
//                 ? 'bg-green-500/20 text-green-200 border-green-500/30' 
//                 : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
//             }`}>
//               {isMining ? 'Earning Rewards' : 'Click to Resume'}
//             </div>
//           )}
//         </button>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
//         <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform relative">
//           <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700">
//             <Lock size={12} />
//           </div>
//           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
//             <Activity size={18} className="sm:size-5" />
//           </div>
//           <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">
//             Total Staked
//           </span>
//           <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
//             {totalStaked.toFixed(2)}
//           </span>
//           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">
//             TON Locked
//           </span>
//         </div>

//         <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform">
//           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-green-50 dark:group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
//             <TrendingUp size={18} className="sm:size-5" />
//           </div>
//           <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">
//             Mining Rate
//           </span>
//           <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
//             {totalStaked > 0 ? (calculateDailyROI(totalStaked) * 100).toFixed(1) : '1.0'}%
//           </span>
//           <span className={`text-[10px] font-bold uppercase tracking-widest ${
//             isMining ? 'text-green-500 animate-pulse' : 'text-slate-500'
//           }`}>
//             {isMining ? 'Mining Now' : 'Daily Rate'}
//           </span>
//         </div>
//       </div>

//       {/* Enhanced Claim Button */}
//       {(currentEarnings > 0 || realTimeEarnings > 0.001) && (
//         <div className="w-full animate-in slide-in-from-bottom duration-500">
//           <button 
//             onClick={handleClaim}
//             disabled={isLoading || currentEarnings <= 0}
//             className={`w-full relative overflow-hidden group bg-slate-900 dark:bg-slate-800 text-white rounded-[28px] sm:rounded-[32px] p-[1px] shadow-2xl transition-all ${
//               isLoading || currentEarnings <= 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'
//             }`}
//           >
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//             <div className="relative bg-slate-900 dark:bg-slate-800 group-hover:bg-transparent rounded-[27px] sm:rounded-[31px] py-4 sm:py-5 flex items-center justify-center gap-3 transition-colors duration-300">
//               <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-white group-hover:text-blue-600 transition-all">
//                 <Sparkles size={16} fill="currentColor" className={`group-hover:scale-110 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
//               </div>
//               <div className="flex flex-col items-start text-left">
//                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400 dark:text-slate-500 group-hover:text-white/80">
//                   {isLoading ? 'Processing...' : currentEarnings > 0 ? 'Claim Rewards' : 'Mining in Progress'}
//                 </span>
//                 <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
//                   {isLoading ? 'Please wait...' : `${(currentEarnings + realTimeEarnings).toFixed(6)} TON`}
//                 </span>
//                 {!isLoading && (
//                   <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
//                     ≈ ${currentEarningsUsd} USD
//                   </span>
//                 )}
//               </div>
//               <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform opacity-40 group-hover:opacity-100" />
//             </div>
//           </button>
//         </div>
//       )}

//       {/* Countdown Timer for Next Claim */}
//       {currentEarnings === 0 && timeUntilNextClaim && totalStaked > 0 && (
//         <div className="w-full animate-in slide-in-from-bottom duration-500">
//           <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[28px] sm:rounded-[32px] border border-slate-200 dark:border-slate-700 py-4 sm:py-5 flex items-center justify-center gap-3">
//             <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
//               <Activity size={16} className="animate-pulse" />
//             </div>
//             <div className="flex flex-col items-start text-left">
//               <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400 dark:text-slate-500">
//                 Next Claim Available In
//               </span>
//               <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
//                 {timeUntilNextClaim}
//               </span>
//               <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
//                 Keep mining for rewards!
//               </span>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };