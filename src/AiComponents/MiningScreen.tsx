
// import React, { useState, useEffect } from 'react';
// import { Zap, TrendingUp, Activity, ChevronRight, Sparkles, ShieldCheck, Database, AlertTriangle } from 'lucide-react';
// import { StakeModal } from './StakeModal';
// import { CONSTANTS } from '@/pages/IndexPage/IndexPage';

// interface MiningScreenProps {
//   stakedAmount: number;
//   liquidAmount: number;
//   claimedAmount: number;
//   startTime: number | null;
//   boostMultiplier: number;
//   onStake: (amount: number) => void;
//   onDeposit: (amount: number) => void;
//   onUnstake: (amount: number) => void;
//   onClaim: (amount: number) => void;
// }

// export const MiningScreen: React.FC<MiningScreenProps> = ({ 
//   stakedAmount, 
//   liquidAmount,
//   claimedAmount, 
//   startTime, 
//   boostMultiplier,
//   onStake, 
//   onDeposit,
//   onClaim 
// }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [minedSession, setMinedSession] = useState<number>(0);
  
//   const RATE_PER_SEC = ((stakedAmount * CONSTANTS.APY) / (365 * 24 * 60 * 60)) * boostMultiplier;

//   useEffect(() => {
//     if (!startTime || stakedAmount <= 0) {
//       setMinedSession(0);
//       return;
//     }

//     const interval = setInterval(() => {
//       const elapsedSeconds = (Date.now() - startTime) / 1000;
//       setMinedSession(elapsedSeconds * RATE_PER_SEC);
//     }, 100);

//     return () => clearInterval(interval);
//   }, [startTime, stakedAmount, RATE_PER_SEC]);

//   const isMining = stakedAmount > 0;
//   const liveTotalDisplay = claimedAmount + minedSession;
  
//   const miningRateHr = (RATE_PER_SEC * 3600).toFixed(6);
//   const usdValue = (liveTotalDisplay * CONSTANTS.SMART_PRICE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

//   return (
//     <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-700">
      
//       {/* Protocol Dashboard Header */}
//       <div className="w-full space-y-2 text-center">
//         <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Protocol Yield Terminal</h2>
//         <div className="flex items-center justify-center gap-3">
//           <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
//             isMining 
//             ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm' 
//             : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
//           }`}>
//              {isMining ? <ShieldCheck size={12} className="animate-pulse" /> : <AlertTriangle size={12} />}
//              <span className="text-[10px] font-black uppercase tracking-widest">
//                {isMining ? 'Secure Session Active' : 'Protocol Inactive'}
//              </span>
//           </div>
//           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400">
//              <Database size={12} />
//              <span className="text-[10px] font-black uppercase tracking-widest">Decentralized Hub</span>
//           </div>
//         </div>
//       </div>

//       {/* Main Counter Display */}
//       <div className="text-center space-y-3">
//         <div className="flex items-baseline justify-center gap-2">
//           <span className={`text-5xl sm:text-6xl font-black tracking-tighter tabular-nums leading-none transition-all duration-1000 ${
//             isMining ? 'bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-500' : 'text-slate-300 dark:text-slate-800'
//           }`}>
//             {liveTotalDisplay.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
//           </span>
//           <span className="text-lg font-black text-blue-600">SMART</span>
//         </div>
        
//         <div className="flex flex-col items-center space-y-4">
//           <div className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">
//              ≈ ${usdValue} USD Live Value
//           </div>
          
//           <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
//             isMining 
//             ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
//             : 'text-slate-400 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-50'
//           }`}>
//             <div className={`w-2 h-2 rounded-full ${isMining ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
//             {isMining ? `Mining Throughput: ${miningRateHr} S / Hr` : 'Throughput: 0.00 S / Hr'}
//           </div>
//         </div>
//       </div>

//       {/* Interaction Core */}
//       <div className="relative group">
//         {isMining && (
//           <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 animate-pulse scale-150 blur-3xl pointer-events-none" />
//         )}
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-700 transform active:scale-95 border-[6px] overflow-hidden ${
//             isMining 
//             ? 'bg-slate-900 dark:bg-[#1E293B] border-blue-500/20 shadow-2xl shadow-blue-500/30' 
//             : 'bg-white dark:bg-slate-900 border-rose-500/20 dark:border-rose-500/10 text-rose-300 dark:text-rose-900/40 shadow-xl'
//           }`}
//         >
//           {isMining && (
//              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent animate-pulse" />
//           )}
//           <Zap size={48} fill={isMining ? "#3B82F6" : "none"} className={`mb-2 transition-all duration-500 relative z-10 ${isMining ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-rose-100 dark:text-rose-950'}`} />
//           <span className={`font-black text-[12px] uppercase tracking-[0.4em] relative z-10 ${isMining ? 'text-blue-400' : 'text-rose-300 dark:text-rose-900/50'}`}>
//             {isMining ? 'PROTOCOL ACTIVE' : 'NODE OFFLINE'}
//           </span>
//         </button>
//       </div>

//       {/* Analytics Grid */}
//       <div className="grid grid-cols-2 gap-4 w-full">
//         <div className="bg-white/60 dark:bg-slate-900/50 p-4 rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl flex flex-col items-center text-center group transition-all hover:border-blue-500/30">
//           <Activity size={24} className={`mb-4 transition-colors ${isMining ? 'text-blue-500' : 'text-slate-300'}`} />
//           <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1.5">Asset Allocation</span>
//           <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">{stakedAmount.toFixed(1)} <span className="text-xs font-bold opacity-30">TON</span></span>
//         </div>
        
//         <div className="bg-white/60 dark:bg-slate-900/50 p-4 rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl flex flex-col items-center text-center group transition-all hover:border-emerald-500/30">
//           <TrendingUp size={24} className={`mb-4 transition-colors ${isMining ? 'text-emerald-500' : 'text-slate-300'}`} />
//           <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1.5">Network APY</span>
//           <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">{(CONSTANTS.APY * 100).toFixed(1)}% <span className="text-xs font-bold opacity-30">FIXED</span></span>
//         </div>
//       </div>

//       {!isMining && (
//         <div className="w-full bg-rose-50 dark:bg-rose-500/5 p-4 rounded-[24px] border border-rose-200/50 dark:border-rose-500/10 flex items-start gap-4 animate-in slide-in-from-top duration-700">
//           <AlertTriangle size={24} className="text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
//           <div className="space-y-1">
//             <h4 className="text-[12px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest leading-none mb-1.5 text-left">Staking Requirement</h4>
//             <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-left">
//               Your node is currently <span className="text-rose-600 font-bold">Unstable</span>. Deposit TON into the validator pool to stabilize your connection and begin generating SMART rewards.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Harvest Action */}
//       {minedSession > 0 && (
//         <div className="w-full animate-in slide-in-from-bottom duration-500">
//           <button 
//             onClick={() => onClaim(minedSession)}
//             className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-[20px] py-4 px-6 flex items-center justify-between shadow-2xl transition-all active:scale-[0.98] group"
//           >
//             <div className="flex items-center gap-4">
//                <Sparkles size={24} className="text-amber-400 group-hover:rotate-12 transition-transform" />
//                <div className="flex flex-col items-start">
//                   <span className="text-[11px] font-black text-blue-400 dark:text-blue-200 uppercase tracking-widest leading-none mb-1">Verify Rewards</span>
//                   <span className="text-base font-black uppercase tracking-widest">Harvest Yield</span>
//                </div>
//             </div>
//             <div className="flex items-center gap-3">
//                <span className="text-lg font-black tabular-nums">+{minedSession.toFixed(4)} <span className="text-[10px]">SMART</span></span>
//                <ChevronRight size={20} className="opacity-40 group-hover:translate-x-1 transition-transform" />
//             </div>
//           </button>
//         </div>
//       )}

//       {/* Fix: use onDeposit from props instead of the undefined handleDepositTon */}
//       <StakeModal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//         onStake={onStake} 
//         onDeposit={onDeposit} 
//         onUnstake={() => {}} 
//         stakedBalance={stakedAmount}
//         liquidBalance={liquidAmount}
//       />
//     </div>
//   );
// };
