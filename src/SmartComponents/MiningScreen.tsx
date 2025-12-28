// import React, { useState, useEffect, useRef } from 'react';
// import { Zap, TrendingUp, Lock, Shield, Sparkles, ChevronRight } from 'lucide-react';
// import { StakeModal } from './StakeModal'; 
// import { TonPriceDisplay } from '../components/TonPriceDisplay';
// import { MarketData } from '@/pages/IndexPage/IndexPage';
// import { useTonPrice } from '@/hooks/useTonPrice';

// interface MiningScreenProps {
//   stakedAmount: number;      // From DB: users.balance
//   currentBalance: number;    // From DB: user_earnings.current_earnings
//   miningRate: number;        // Calculated: Rate per second
//   isMining: boolean;         // Logic: stakedAmount > 0
//   onStake: (amount: number) => void;
//   onClaim: () => void;
//   onUnstake?: (amount: number) => void; // Optional if you implement unstaking later
//   boostMultiplier?: number;
//   startTime?: number | null; // Kept for interface compatibility, though largely unused now
//   marketData: MarketData;
// }

// export const MiningScreen: React.FC<MiningScreenProps> = ({
//   stakedAmount,
//   currentBalance,
//   miningRate,
//   isMining,
//   onStake,
//   onClaim,
//   marketData,
//   boostMultiplier = 1.0
// }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [displayedBalance, setDisplayedBalance] = useState(currentBalance);
//   const lastUpdateRef = useRef(Date.now());
  
//   // Get real TON price
//   const { tonPrice, change24h, isLoading: priceLoading, error: priceError, refreshPrice } = useTonPrice();

//   useEffect(() => {
//     // If not mining, just show the static DB value
//     if (!isMining || miningRate <= 0) {
//       setDisplayedBalance(currentBalance);
//       return;
//     }

//     // When parent sends a new solid number (from DB/Parent Sync), reset baseline
//     setDisplayedBalance(currentBalance);
//     lastUpdateRef.current = Date.now();

//     // Start high-frequency ticker
//     const interval = setInterval(() => {
//       const now = Date.now();
//       const elapsedSec = (now - lastUpdateRef.current) / 1000;
      
//       // Predict next number: Current + (Rate * Time)
//       setDisplayedBalance(currentBalance + (elapsedSec * miningRate));
//     }, 50); // 20 FPS updates

//     return () => clearInterval(interval);
//   }, [currentBalance, miningRate, isMining]);

//   // Derived Values
//   const miningRateHr = (miningRate * 3600).toFixed(4);
  
//   // Use real TON price instead of mock data
//   const realTonPrice = tonPrice;
//   const usdValue = (displayedBalance * realTonPrice).toLocaleString(undefined, { 
//     minimumFractionDigits: 2, 
//     maximumFractionDigits: 2 
//   });
//   const usdRateHr = (parseFloat(miningRateHr) * realTonPrice).toFixed(4);
  
//   // Calculate staked value in USD
//   const stakedUsdValue = (stakedAmount * realTonPrice).toLocaleString(undefined, { 
//     minimumFractionDigits: 2, 
//     maximumFractionDigits: 2 
//   });

//   return (
//     <div className="flex flex-col items-center space-y-6 sm:space-y-8 animate-in fade-in duration-700 w-full max-w-md mx-auto">
      
//       {/* 1. Protocol Status Badge */}
//       <div className="w-full space-y-2 text-center">
//         <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
//           Protocol Yield Terminal
//         </h2>
//         <div className="flex items-center justify-center gap-3">
//           <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
//             isMining
//             ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-sm'
//             : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
//           }`}>
//               <Shield size={12} className={isMining ? "animate-pulse" : ""} />
//               <span className="text-[10px] font-black uppercase tracking-widest">
//                 {isMining ? 'Secure Node Active' : 'Node Offline'}
//               </span>
//           </div>
//         </div>
//       </div>

//       {/* 2. The Big Counter (Matrix Style) */}
//       <div className="text-center space-y-2 mt-2 sm:mt-4 relative z-10">
//         <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
//           Mined Balance
//         </span>
        
//         <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
//           {/* font-mono ensures numbers don't jitter left/right as they change */}
//           <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none font-mono">
//             {displayedBalance.toFixed(6)}
//           </span>
//           <span className="text-lg sm:text-xl font-bold text-blue-500">TON</span>
//         </div>
        
//         <div className="flex flex-col items-center gap-1">
//           <div className="flex items-center gap-2">
//             <span className="text-slate-400 dark:text-slate-500 font-bold text-sm sm:text-base animate-pulse">
//               ≈ ${usdValue} USD
//             </span>
//           </div>
          
//           {/* TON Price Display Component */}
//           <TonPriceDisplay
//             tonPrice={realTonPrice}
//             change24h={change24h}
//             isLoading={priceLoading}
//             error={priceError}
//             onRefresh={refreshPrice}
//             showEarnings={true}
//             dailyEarnings={parseFloat(miningRateHr) / 24}
//             dailyUsdValue={usdRateHr}
//             isStaking={isMining}
//           />
          
//           {/* Boost Multiplier Display */}
//           {isMining && boostMultiplier > 1 && (
//             <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-2">
//               Boost Active x{boostMultiplier}
//             </span>
//           )}
//         </div>
//       </div>

//       {/* 3. The Big Action Button */}
//       <div className="relative group">
//         {isMining && (
//           <div className="absolute inset-0 rounded-full bg-green-400/20 animate-pulse-ring scale-110 pointer-events-none blur-xl" />
//         )}
        
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className={`relative z-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 transform active:scale-95 ${
//             isMining 
//             ? 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border-8 border-slate-100/10 shadow-2xl shadow-green-900/20' 
//             : 'bg-white dark:bg-slate-900 border-8 border-slate-50 dark:border-white/5 shadow-xl hover:border-blue-100 dark:hover:border-blue-500/20'
//           }`}
//         >
//           <Zap 
//             size={56} 
//             fill={isMining ? "white" : "none"} 
//             className={`mb-2 transition-all duration-500 ${
//               isMining 
//               ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] scale-110' 
//               : 'text-slate-300 dark:text-slate-700'
//             }`} 
//           />
//           <span className={`font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] ${
//             isMining ? 'text-white' : 'text-slate-400'
//           }`}>
//             {isMining ? 'System Active' : 'Start Mining'}
//           </span>
          
//           {isMining && (
//              <div className="mt-3 px-3 py-1 bg-white/10 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
//                Verified
//              </div>
//           )}
//         </button>
//       </div>

//       {/* 4. Stats Grid */}
//       <div className="grid grid-cols-2 gap-4 w-full">
//         {/* Staked Card */}
//         <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
//           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
//             <Lock size={40} />
//           </div>
//           <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">
//             Total Staked
//           </span>
//           <span className="text-slate-900 dark:text-white font-black text-xl">
//             {stakedAmount.toFixed(2)} TON
//           </span>
//           <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 mb-1">
//             ≈ ${stakedUsdValue} USD
//           </span>
//           <span className="text-[9px] font-bold text-blue-500 uppercase mt-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
//             Principal Safe
//           </span>
//         </div>
        
//         {/* APY Card */}
//         <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
//            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
//             <TrendingUp size={40} />
//           </div>
//           <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">
//             Current Daily ROI
//           </span>
//           <span className="text-slate-900 dark:text-white font-black text-xl">
//             1.0-3.0%
//           </span>
//            <span className="text-[9px] font-bold text-green-500 uppercase mt-1 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded">
//             Daily Returns
//           </span>
//         </div>
//       </div>

//       {/* 5. Claim / Harvest Button */}
//       {displayedBalance > 0.0001 && (
//         <div className="w-full animate-in slide-in-from-bottom duration-500 pt-2 pb-4">
//           <button 
//             onClick={onClaim}
//             className="w-full group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] p-1 shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
//           >
//             {/* Gradient Border Effect */}
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
//             <div className="relative bg-slate-900 dark:bg-white rounded-[22px] py-4 flex items-center justify-between px-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30">
//                   <Sparkles size={18} fill="currentColor" />
//                 </div>
//                 <div className="flex flex-col items-start text-left">
//                   <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
//                     Ready to Harvest
//                   </span>
//                   <span className="text-sm font-black uppercase tracking-widest tabular-nums">
//                     {displayedBalance.toFixed(4)} TON
//                   </span>
//                   <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
//                     ≈ ${(displayedBalance * realTonPrice).toFixed(2)} USD
//                   </span>
//                 </div>
//               </div>
//               <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
//                  <ChevronRight size={16} />
//               </div>
//             </div>
//           </button>
//         </div>
//       )}

//       {/* Stake Modal */}
//       <StakeModal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//         onStake={onStake} 
//         onUnstake={() => {}} 
//         stakedBalance={stakedAmount}
//       />
//     </div>
//   );
// };