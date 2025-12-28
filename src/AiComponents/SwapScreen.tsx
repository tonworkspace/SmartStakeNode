
// import React, { useState } from 'react';
// import { Info, ChevronDown, Repeat, Lock, Sparkles, ArrowLeftRight } from 'lucide-react';
// import { CONSTANTS } from '@/pages/IndexPage/IndexPage';

// interface SwapScreenProps {
//   claimedBalance: number;
// }

// export const SwapScreen: React.FC<SwapScreenProps> = ({ claimedBalance }) => {
//   const [amount, setAmount] = useState<string>('');
//   const [targetToken] = useState<'USDT' | 'TON' | 'BTC'>('USDT');

//   const getEstimatedValue = () => {
//     const val = parseFloat(amount) || 0;
//     const usdVal = val * CONSTANTS.SMART_PRICE;
//     if (targetToken === 'USDT') return usdVal.toFixed(2);
//     if (targetToken === 'TON') return (usdVal / CONSTANTS.TON_PRICE).toFixed(4);
//     if (targetToken === 'BTC') return (usdVal / 95000).toFixed(8);
//     return '0.00';
//   };

//   return (
//     <div className="flex flex-col space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      
//       {/* Bridge Header */}
//       <div className="space-y-1">
//         <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Bridge Protocol</h2>
//         <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Liquidity & Asset Exchange</p>
//       </div>

//       {/* Main Bridge Console */}
//       <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/60 dark:border-white/5 shadow-sm relative overflow-hidden">
//         {/* Professional Lock Layer */}
//         <div className="absolute inset-0 bg-slate-50/60 dark:bg-slate-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
//            <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-2xl animate-pulse border dark:border-white/10">
//               <Lock size={32} />
//            </div>
//            <div className="space-y-2">
//              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vault Initialization</h3>
//              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
//                Bridge Liquidity is being finalized. Gateway opens post-Genesis Phase.
//              </p>
//            </div>
//            <div className="flex gap-2">
//               <div className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Genesis Stage 1</div>
//               <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">Bridge Pending</div>
//            </div>
//         </div>

//         <div className="space-y-5">
//           {/* Source Input */}
//           <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/60 dark:border-white/5">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Protocol Inbound</span>
//               <span className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Holdings: {claimedBalance.toFixed(2)} S</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-3xl font-black text-slate-900 dark:text-white outline-none w-1/2 tabular-nums" />
//               <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
//                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">S</div>
//                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">SMART</span>
//               </div>
//             </div>
//           </div>

//           {/* Swap Divider */}
//           <div className="flex justify-center -my-8 relative z-10">
//             <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/5 flex items-center justify-center text-blue-500 shadow-lg">
//               <ArrowLeftRight size={20} />
//             </div>
//           </div>

//           {/* Target Output */}
//           <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/60 dark:border-white/5">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Network Outbound</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-3xl font-black text-slate-300 dark:text-slate-700 tabular-nums">{getEstimatedValue()}</span>
//               <button className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
//                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{targetToken}</span>
//                  <ChevronDown size={16} className="text-slate-400" />
//               </button>
//             </div>
//           </div>

//           <div className="px-1 space-y-2">
//              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
//                 <span>Network Rate</span>
//                 <span className="text-slate-900 dark:text-slate-300">1 SMART = ${CONSTANTS.SMART_PRICE}</span>
//              </div>
//              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
//                 <span>Volatility Buffer</span>
//                 <span className="text-slate-900 dark:text-slate-300">0.5% Guaranteed</span>
//              </div>
//           </div>
//         </div>
//       </div>

//       {/* Protocol Roadmap Overlay Grid */}
//       <div className="grid grid-cols-1 gap-4">
//         <div className="bg-white/60 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl flex items-start gap-5">
//            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
//               <Sparkles size={24} />
//            </div>
//            <div>
//               <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">Genesis Cycle</h4>
//               <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
//                 The current phase focuses on building decentralized liquidity through TON staking. Rewards are finalized per block.
//               </p>
//            </div>
//         </div>

//         <div className="bg-white/60 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl flex items-start gap-5 opacity-50">
//            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
//               <Repeat size={24} />
//            </div>
//            <div>
//               <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">DEX Settlement</h4>
//               <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
//                 Integration with Ston.fi and DeDust liquidity pools for automated SMART/TON market making.
//               </p>
//            </div>
//         </div>
//       </div>

//       {/* Stability Warning Footer */}
//       <div className="bg-blue-50 dark:bg-blue-500/5 p-6 rounded-[32px] flex items-start gap-4 border border-blue-100 dark:border-blue-500/20">
//         <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
//         <div className="space-y-1">
//           <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Protocol Notice</h4>
//           <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
//             SmartAI utilizes non-custodial bridging logic. Your balances are stored on-chain and will become instantly swappable once the Phase 2 Governance activation is complete.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
