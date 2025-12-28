
// import React, { useState } from 'react';
// import { Wallet, ArrowUpRight, ArrowDownLeft, History, ShoppingBag, ArrowRight, ShieldCheck, Zap, Info } from 'lucide-react';
// import { ActivityRecord, CONSTANTS } from '@/pages/IndexPage/IndexPage';

// interface WalletScreenProps {
//   claimedAmount: number;
//   stakedAmount: number;
//   activities: ActivityRecord[];
//   onWithdrawSmart: (amount: number) => void;
//   address: string | null;
// }

// export const WalletScreen: React.FC<WalletScreenProps> = ({ claimedAmount, stakedAmount, activities, onWithdrawSmart, address }) => {
//   const [withdrawAmount, setWithdrawAmount] = useState('');

//   const formatTime = (ts: number) => {
//     const diff = Date.now() - ts;
//     const minutes = Math.floor(diff / 60000);
//     if (minutes < 1) return 'Just now';
//     if (minutes < 60) return `${minutes}m ago`;
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours}h ago`;
//     return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
//   };

//   const smartUsd = claimedAmount * CONSTANTS.SMART_PRICE;
//   const tonUsd = stakedAmount * CONSTANTS.TON_PRICE;
//   const totalUsd = smartUsd + tonUsd;

//   return (
//     <div className="flex flex-col space-y-8 animate-in slide-in-from-right duration-500 pb-10">
//       <div className="flex justify-between items-start">
//         <div className="space-y-1">
//           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Direct Assets</h2>
//           <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Verified Balances on TON</p>
//         </div>
//         <div className="text-right">
//           <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Net Value</span>
//           <div className="text-slate-900 dark:text-white font-black text-xl tabular-nums leading-none">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
//         </div>
//       </div>

//       {/* Primary Withdrawal Hub */}
//       <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-[32px] text-white space-y-6 shadow-2xl relative overflow-hidden group border dark:border-white/5">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
        
//         <div className="space-y-2 relative z-10">
//            <div className="flex justify-between items-center">
//               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Withdrawal Gateway</h3>
//               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg text-[8px] font-black uppercase">
//                  <Zap size={10} fill="currentColor" /> Live Network
//               </div>
//            </div>
//            <div className="flex items-baseline gap-2">
//               <span className="text-4xl font-black tabular-nums">{claimedAmount.toFixed(4)}</span>
//               <span className="text-blue-500 font-black text-sm uppercase tracking-widest">SMART</span>
//            </div>
           
//            <div className="flex items-center gap-2 mt-4 bg-white/5 p-4 rounded-2xl border border-white/5">
//               <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-400">
//                 <Wallet size={16} />
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Destination Wallet</span>
//                 <span className="text-[10px] font-bold text-slate-200 tabular-nums truncate max-w-[150px]">{address || 'Connecting...'}</span>
//               </div>
//            </div>
//         </div>

//         <div className="relative z-10 flex flex-col gap-3">
//            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 py-1">
//               <input 
//                 type="number" 
//                 value={withdrawAmount}
//                 onChange={(e) => setWithdrawAmount(e.target.value)}
//                 placeholder="0.00 (Min 1.0)"
//                 className="bg-transparent text-lg font-black text-white outline-none w-full placeholder:text-slate-600 h-14"
//               />
//               <button 
//                 onClick={() => setWithdrawAmount(claimedAmount.toString())}
//                 className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2 px-3 py-1 bg-blue-500/10 rounded-lg"
//               >
//                 MAX
//               </button>
//            </div>
//            <button 
//              onClick={() => {
//                onWithdrawSmart(parseFloat(withdrawAmount));
//                setWithdrawAmount('');
//              }}
//              disabled={!withdrawAmount || parseFloat(withdrawAmount) < CONSTANTS.MIN_WITHDRAWAL || parseFloat(withdrawAmount) > claimedAmount}
//              className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-400 transition-all disabled:opacity-20 active:scale-[0.98] shadow-lg"
//            >
//               Authorize Transfer <ArrowRight size={16} />
//            </button>
//         </div>
//       </div>

//       <div className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-1">Vault Overview</h3>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center justify-between group backdrop-blur-sm">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
//               <ShieldCheck size={24} />
//             </div>
//             <div>
//               <div className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight">TON Stake</div>
//               <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Locked: Genesis Phase</div>
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="text-slate-900 dark:text-white font-black text-xl tabular-nums">{stakedAmount.toFixed(2)}</div>
//             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">≈ ${tonUsd.toFixed(2)} USD</div>
//           </div>
//         </div>
//       </div>

//       <div className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-1">Transaction Ledger</h3>
//         <div className="space-y-3">
//           {activities.length > 0 ? (
//             activities.map((act) => (
//               <div key={act.id} className="bg-white/60 dark:bg-slate-900/50 p-5 rounded-[28px] border border-slate-200/60 dark:border-white/5 flex items-center justify-between group backdrop-blur-sm">
//                 <div className="flex items-center gap-4">
//                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
//                     act.type === 'claim' ? 'bg-emerald-500/10 text-emerald-500' : 
//                     act.type === 'withdraw_smart' ? 'bg-blue-500/10 text-blue-500' : 
//                     'bg-slate-500/10 text-slate-400'
//                   }`}>
//                     {act.type === 'claim' ? <ArrowDownLeft size={18} /> : 
//                      act.type === 'withdraw_smart' ? <ArrowUpRight size={18} /> : 
//                      <ShoppingBag size={18} />}
//                   </div>
//                   <div>
//                     <div className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-tight">
//                       {act.type === 'stake' ? 'Staked TON' : act.type === 'claim' ? 'Harvested' : act.type === 'withdraw_smart' ? 'Transfer' : act.label || 'Purchase'}
//                     </div>
//                     <div className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">{formatTime(act.timestamp)}</div>
//                   </div>
//                 </div>
//                 <div className={`text-sm font-black tabular-nums text-right ${
//                   act.type === 'claim' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
//                 }`}>
//                   {act.type === 'stake' || act.type === 'purchase' || act.type === 'withdraw_smart' ? '-' : '+'}{act.amount.toFixed(2)} {act.token}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-30">
//               <History size={40} className="text-slate-200 dark:text-slate-800" />
//               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Ledger</p>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="bg-blue-50 dark:bg-blue-500/5 p-6 rounded-[32px] flex items-start gap-4 border border-blue-200 dark:border-blue-500/10">
//         <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
//         <div className="space-y-1">
//           <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Protocol Notice</h4>
//           <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
//             Blockchain transactions are irreversible. Ensure destination address accuracy before authorizing transfers.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
