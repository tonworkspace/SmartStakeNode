
// import React, { useState, useEffect } from 'react';
// import { X, ShieldCheck, ArrowUpCircle, Lock, Info, TrendingUp, Download, Wallet } from 'lucide-react';
// import { CONSTANTS } from '@/pages/IndexPage/IndexPage';

// interface StakeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onStake: (amount: number) => void;
//   onDeposit: (amount: number) => void;
//   onUnstake: (amount: number) => void;
//   stakedBalance: number;
//   liquidBalance: number;
// }

// export const StakeModal: React.FC<StakeModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   onStake, 
//   onDeposit,
//   // onUnstake, 
//   stakedBalance,
//   liquidBalance
// }) => {
//   const [activeTab, setActiveTab] = useState<'stake' | 'deposit' | 'unstake'>('stake');
//   const [amount, setAmount] = useState<string>('');
//   const [projection, setProjection] = useState({ daily: '0.00', monthly: '0.00' });

//   useEffect(() => {
//     const val = parseFloat(amount) || 0;
//     const daily = (val * CONSTANTS.APY) / 365;
//     setProjection({
//       daily: daily.toFixed(4),
//       monthly: (daily * 30.44).toFixed(2)
//     });
//   }, [amount]);

//   if (!isOpen) return null;

//   const handleQuickAmount = (val: number) => {
//     setAmount(val.toString());
//   };

//   const isStake = activeTab === 'stake';
//   const isDeposit = activeTab === 'deposit';
//   // const  = stakedBalance === 0;

//   return (
//     <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-6">
//       {/* Backdrop */}
//       <div 
//         className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300" 
//         onClick={onClose} 
//       />
      
//       {/* Modal Container */}
//       <div className="relative w-full max-w-md bg-white dark:bg-[#0B1120] rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom duration-500 ease-out max-h-[96vh] flex flex-col border-t dark:border-white/10">
        
//         <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-5 mb-1 sm:hidden shrink-0" />
        
//         <div className="px-8 pt-6 pb-10 space-y-6 overflow-y-auto custom-scrollbar">
//           {/* Enhanced Balances Banner */}
//           <div className="grid grid-cols-2 gap-3">
//              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 rounded-3xl flex flex-col items-center">
//                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Liquid (Wallet)</span>
//                 <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{liquidBalance.toFixed(1)} TON</span>
//              </div>
//              <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-3xl flex flex-col items-center">
//                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Staked (Pool)</span>
//                 <span className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums">{stakedBalance.toFixed(1)} TON</span>
//              </div>
//           </div>

//           <div className="flex justify-between items-start">
//             <div className="space-y-1">
//               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
//                 {isDeposit ? 'Deposit Liquidity' : isStake ? 'Genesis Staking' : 'Governance'}
//               </h3>
//               <p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
//                 The Open Network &middot; SmartStake v2
//               </p>
//             </div>
//             <button 
//               onClick={onClose}
//               className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all active:scale-90"
//             >
//               <X size={20} />
//             </button>
//           </div>

//           {/* Institutional Triple Tab Control */}
//           <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[24px] w-full border border-slate-200/50 dark:border-white/5">
//              <button 
//                 onClick={() => { setActiveTab('deposit'); setAmount(''); }}
//                 className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${isDeposit ? 'bg-white dark:bg-blue-600 shadow-lg text-blue-600 dark:text-white' : 'text-slate-500'}`}
//              >
//                 Deposit
//              </button>
//              <button 
//                 onClick={() => { setActiveTab('stake'); setAmount(''); }}
//                 className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${isStake ? 'bg-white dark:bg-blue-600 shadow-lg text-blue-600 dark:text-white' : 'text-slate-500'}`}
//              >
//                 Stake
//              </button>
//              <button 
//                 onClick={() => { setActiveTab('unstake'); setAmount(''); }}
//                 className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${activeTab === 'unstake' ? 'bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white' : 'text-slate-500'}`}
//              >
//                 Vault
//              </button>
//           </div>

//           {(isStake || isDeposit) ? (
//             <div className="space-y-6 animate-in fade-in duration-300">
//               <div className="space-y-5">
//                 {/* Visual Pathway for Deposit */}
//                 {isDeposit && (
//                   <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border dark:border-white/5">
//                      <div className="flex flex-col items-center gap-1">
//                         <Wallet size={20} className="text-slate-400" />
//                         <span className="text-[8px] font-black text-slate-400 uppercase">External</span>
//                      </div>
//                      <div className="flex-1 flex flex-col items-center gap-1.5 px-4">
//                         <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800 relative">
//                            <div className="absolute inset-y-0 left-0 bg-blue-500 w-1/2 animate-[marquee_2s_linear_infinite]" />
//                         </div>
//                         <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Protocol Bridge</span>
//                      </div>
//                      <div className="flex flex-col items-center gap-1">
//                         <ShieldCheck size={20} className="text-blue-500" />
//                         <span className="text-[8px] font-black text-blue-500 uppercase">Liquid</span>
//                      </div>
//                   </div>
//                 )}

//                 <div className="relative">
//                   <input
//                     type="number"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     placeholder="0.00"
//                     className="w-full h-24 sm:h-28 text-4xl font-black px-8 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] border border-slate-200 dark:border-white/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700 tabular-nums text-slate-900 dark:text-white"
//                   />
//                   <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] text-sm">TON</div>
//                 </div>

//                 {isStake && parseFloat(amount) > 0 && (
//                   <div className="grid grid-cols-2 gap-3 animate-in zoom-in duration-300">
//                     <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10 flex flex-col">
//                        <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Expected Daily</span>
//                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-lg">+{projection.daily} <span className="text-[10px]">SMART</span></span>
//                     </div>
//                     <div className="bg-blue-500/5 p-4 rounded-3xl border border-blue-500/10 flex flex-col">
//                        <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Expected Monthly</span>
//                        <span className="text-blue-600 dark:text-blue-400 font-black text-lg">+{projection.monthly} <span className="text-[10px]">SMART</span></span>
//                     </div>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-4 gap-3">
//                   {[25, 100, 500, 1000].map((amt) => (
//                     <button
//                       key={amt}
//                       onClick={() => handleQuickAmount(amt)}
//                       className="py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
//                     >
//                       {amt} T
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <button
//                   onClick={() => {
//                     const val = parseFloat(amount);
//                     if (val > 0) {
//                       if (isDeposit) onDeposit(val);
//                       else onStake(val);
//                       onClose();
//                     }
//                   }}
//                   disabled={!amount || parseFloat(amount) <= 0 || (isStake && parseFloat(amount) > liquidBalance)}
//                   className={`w-full py-5 rounded-[28px] text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-30 ${isDeposit ? 'bg-slate-900 dark:bg-slate-800' : 'bg-blue-600'}`}
//                 >
//                   {isDeposit ? <Download size={20} /> : <ArrowUpCircle size={20} />}
//                   {isDeposit ? 'Authorize Deposit' : 'Finalize Stake'}
//                 </button>
//                 <div className="flex justify-center items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                   <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> Secure Protocol</span>
//                   {isStake && <span className="flex items-center gap-1"><TrendingUp size={12} className="text-blue-500" /> {(CONSTANTS.APY * 100).toFixed(1)}% APY</span>}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-6 py-6 animate-in fade-in duration-300 text-center">
//               <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-600 shadow-inner">
//                 <Lock size={40} />
//               </div>
//               <div className="space-y-3">
//                  <h4 className="text-slate-900 dark:text-white font-black text-xl tracking-tight">Governance Locking Policy</h4>
//                  <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium leading-relaxed max-w-[320px] mx-auto">
//                     To ensure protocol stability during the **Genesis Liquidity Phase**, all staked TON is algorithmically locked within the validator vault.
//                  </p>
//               </div>
              
//               <div className="bg-blue-50 dark:bg-blue-500/5 p-5 rounded-[32px] border border-blue-200 dark:border-blue-500/10 flex flex-col gap-4 text-left">
//                  <div className="flex gap-3">
//                    <Info className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
//                    <div className="space-y-1">
//                       <span className="text-[11px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">Withdrawal Roadmap</span>
//                       <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
//                         Unstaking capabilities will be authorized by the Governance Council following the Phase 2 DEX Listing event.
//                       </p>
//                    </div>
//                  </div>
//               </div>

//               <button 
//                 onClick={onClose}
//                 className="w-full py-5 rounded-[28px] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
//               >
//                 Return to Protocol Console
//               </button>
//             </div>
//           )}

//           <div className="pt-6 border-t dark:border-white/5 flex flex-col items-center gap-4">
//             <div className="flex items-center gap-2">
//                <ShieldCheck size={14} className="text-blue-500" />
//                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">SmartStake Protocol &middot; Genesis Node</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
