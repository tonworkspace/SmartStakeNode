
// import React from 'react';
// import { Zap, ShieldCheck, Sparkles, TrendingUp, ChevronRight, Lock, Database } from 'lucide-react';
// import { UpgradeState } from '@/pages/IndexPage/IndexPage';


// interface MarketplaceScreenProps {
//   claimedBalance: number;
//   liquidTon: number;
//   upgradeLevels: UpgradeState;
//   onPurchaseUpgrade: (id: string, cost: number, currency: 'TON' | 'SMART', label: string) => void;
//   currentBoost: number;
// }

// export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ 
//   claimedBalance, 
//   liquidTon,
//   upgradeLevels,
//   onPurchaseUpgrade, 
//   currentBoost 
// }) => {
  
//   const getUpgradeItems = () => [
//     {
//       id: 'turbo',
//       name: 'Mining Turbo',
//       description: 'Increases base throughput by +15% per level.',
//       baseCost: 10,
//       costType: 'SMART' as const,
//       icon: <Zap className="text-amber-500" size={24} />,
//       color: 'bg-amber-50 dark:bg-amber-500/10',
//       currentLevel: upgradeLevels.turbo
//     },
//     {
//       id: 'vault',
//       name: 'Vault Expansion',
//       description: 'Institutional security layer. +5% global yield bonus.',
//       baseCost: 2.5,
//       costType: 'TON' as const,
//       icon: <ShieldCheck className="text-blue-500" size={24} />,
//       color: 'bg-blue-50 dark:bg-blue-500/10',
//       currentLevel: upgradeLevels.vault
//     },
//     {
//       id: 'quantum',
//       name: 'Quantum Core',
//       description: 'Advanced AI processing. +50% massive throughput spike.',
//       baseCost: 50,
//       costType: 'SMART' as const,
//       icon: <Sparkles className="text-green-500" size={24} />,
//       color: 'bg-green-50 dark:bg-green-500/10',
//       currentLevel: upgradeLevels.quantum
//     },
//     {
//       id: 'network',
//       name: 'Network Booster',
//       description: 'Optimizes validator connection. +10% yield efficiency.',
//       baseCost: 5,
//       costType: 'TON' as const,
//       icon: <Database className="text-purple-500" size={24} />,
//       color: 'bg-purple-50 dark:bg-purple-500/10',
//       currentLevel: upgradeLevels.network
//     }
//   ];

//   const calculateCost = (base: number, level: number) => {
//     // Scaling cost: Base * (1.8 ^ level)
//     return Math.round(base * Math.pow(1.8, level) * 10) / 10;
//   };

//   const LevelPips = ({ current }: { current: number }) => (
//     <div className="flex gap-1 mt-2">
//       {[1, 2, 3, 4, 5].map((lvl) => (
//         <div 
//           key={lvl} 
//           className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
//             lvl <= current 
//             ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
//             : 'bg-slate-200 dark:bg-slate-800'
//           }`} 
//         />
//       ))}
//     </div>
//   );

//   return (
//     <div className="flex flex-col space-y-8 animate-in slide-in-from-right duration-500 pb-10">
//       <div className="flex justify-between items-start">
//         <div className="space-y-1">
//           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ecosystem Upgrades</h2>
//           <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Institutional Tier Logic</p>
//         </div>
//         <div className="flex flex-col gap-1.5 items-end">
//            <div className="px-3 py-1 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center gap-2 border dark:border-white/5">
//               <span className="text-[8px] font-black text-slate-400 uppercase">SMART</span>
//               <span className="text-white font-black text-xs tabular-nums">{claimedBalance.toFixed(1)}</span>
//            </div>
//            <div className="px-3 py-1 bg-blue-600 rounded-xl flex items-center gap-2">
//               <span className="text-[8px] font-black text-white/60 uppercase">TON</span>
//               <span className="text-white font-black text-xs tabular-nums">{liquidTon.toFixed(1)}</span>
//            </div>
//         </div>
//       </div>

//       {/* Global Efficiency Module */}
//       <div className="bg-slate-900 dark:bg-blue-900/40 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden group border dark:border-white/5">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
//         <div className="flex justify-between items-center relative z-10">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
//               <TrendingUp size={24} className="text-blue-400" />
//             </div>
//             <div>
//               <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Mining Boost</div>
//               <div className="text-2xl font-black tabular-nums">x{currentBoost.toFixed(2)}</div>
//             </div>
//           </div>
//           <div className="text-right">
//              {/* Fixed: Explicitly cast Object.values to number[] to resolve 'unknown' operator '+' error */}
//              <div className="text-emerald-400 font-black text-lg">LEVEL {(Object.values(upgradeLevels) as number[]).reduce((a, b) => a + b, 0)}</div>
//              <div className="text-[8px] font-black uppercase tracking-widest opacity-50">Cumulative Tier</div>
//           </div>
//         </div>
//       </div>

//       {/* Hybrid Marketplace List */}
//       <div className="space-y-4">
//         <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-1">Institutional Upgrades</h3>
//         <div className="grid grid-cols-1 gap-4">
//           {getUpgradeItems().map((item) => {
//             const currentCost = calculateCost(item.baseCost, item.currentLevel);
//             const isMaxed = item.currentLevel >= 5;
//             const canAfford = (item.costType === 'TON' ? liquidTon : claimedBalance) >= currentCost;

//             return (
//               <div key={item.id} className="bg-white/60 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-200/60 dark:border-white/5 shadow-sm space-y-5 transition-all group backdrop-blur-sm">
//                 <div className="flex justify-between items-start">
//                   <div className="flex items-center gap-4">
//                     <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
//                       {item.icon}
//                     </div>
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <span className="text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-tight leading-none">{item.name}</span>
//                         {isMaxed && <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[7px] font-black uppercase tracking-widest border border-amber-500/20">Elite</div>}
//                       </div>
//                       <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed font-medium mt-1.5">{item.description}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Level</span>
//                     <div className="text-lg font-black text-slate-900 dark:text-white">{item.currentLevel}/5</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between pt-2">
//                   <LevelPips current={item.currentLevel} />
//                   {!isMaxed ? (
//                     <button 
//                       onClick={() => onPurchaseUpgrade(item.id, currentCost, item.costType, item.name)}
//                       disabled={!canAfford}
//                       className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center gap-2 border ${
//                         canAfford 
//                         ? (item.costType === 'TON' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 dark:bg-white border-transparent text-white dark:text-slate-950 shadow-lg') 
//                         : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-400 cursor-not-allowed'
//                       }`}
//                     >
//                       {currentCost} {item.costType}
//                       <ChevronRight size={14} />
//                     </button>
//                   ) : (
//                     <div className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
//                       <Lock size={12} /> MAX LEVEL
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <div className="bg-blue-50 dark:bg-blue-500/5 p-6 rounded-[32px] flex items-start gap-4 border border-blue-100 dark:border-blue-500/20">
//         <ShieldCheck className="text-blue-500 shrink-0 mt-0.5" size={24} />
//         <div className="space-y-1">
//           <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Upgrade Integrity</h4>
//           <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
//             All marketplace upgrades are permanently recorded in your protocol profile. Boosts apply instantly to current and future mining sessions.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
