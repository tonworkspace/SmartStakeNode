
// import React from 'react';
// import { 
//   Users, 
//   Gift, 
//   Copy, 
//   Share2, 
//   Award, 
//   Banknote, 
//   ShieldCheck, 
//   Lock, 
//   CheckCircle2, 
//   Medal, 
//   Flame, 
//   Trophy 
// } from 'lucide-react';
// import { toast } from 'react-hot-toast';

// interface InviteScreenProps {
//   address: string | null;
//   referralCount: number;
//   activeStakers: number;
//   sponsorCode?: string;
// }

// export const InviteScreen: React.FC<InviteScreenProps> = ({ address, referralCount, activeStakers, sponsorCode }) => {
//   const referralLink = sponsorCode
//     ? `https://t.me/SmartStakeAI_Bot?start=${sponsorCode}`
//     : `https://t.me/SmartStakeAI_Bot?start=${address?.slice(0, 8)}`;
  
//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(referralLink);
//     toast.success("Link copied to clipboard!", { icon: '🔗' });
//   };

//   const milestones = [
//     {
//       id: 'bronze',
//       name: 'Bronze Miner',
//       requirement: 10,
//       reward: 'Permanent +0.05x Boost',
//       icon: <Medal size={20} className="text-amber-600" />,
//       bg: 'bg-amber-50 dark:bg-amber-900/10',
//       badge: '🥉'
//     },
//     {
//       id: 'silver',
//       name: 'Silver Node',
//       requirement: 50,
//       reward: '+50 SMART One-time Bonus',
//       icon: <Flame size={20} className="text-slate-400" />,
//       bg: 'bg-slate-50 dark:bg-slate-800/20',
//       badge: '🥈'
//     },
//     {
//       id: 'whale',
//       name: 'Whale Ambassador',
//       requirement: 100,
//       reward: '500 USDT Direct Payout',
//       icon: <Trophy size={20} className="text-green-500" />,
//       bg: 'bg-green-50 dark:bg-green-900/10',
//       badge: '🏆'
//     }
//   ];

//   return (
//     <div className="flex flex-col space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500 pb-10">
//       <div className="space-y-1">
//         <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Refer & Earn</h2>
//         <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Build the decentralized network of the future</p>
//       </div>

//       {/* Referral Link Card */}
//       <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
//         <div className="flex items-center gap-4">
//           <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
//              <Gift size={24} />
//           </div>
//           <div>
//             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Referral Link</h3>
//             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Earn SMART for every invite</p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
//            <span className="flex-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase">
//              {sponsorCode ? `Use Code: ${sponsorCode}` : referralLink}
//            </span>
//            <button
//             onClick={copyToClipboard}
//             className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-900 dark:text-white hover:text-green-500 dark:hover:text-green-400 border border-slate-100 dark:border-white/10 shadow-sm transition-all active:scale-90"
//            >
//              <Copy size={16} />
//            </button>
//          </div>

//         <button 
//           className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 border dark:border-white/5"
//         >
//           <Share2 size={16} />
//           Share Referral Code
//         </button>
//       </div>

//       {/* Dynamic Milestones Roadmap */}
//       <div className="space-y-4">
//         <div className="flex items-center justify-between px-1">
//           <div className="flex items-center gap-2">
//             <Award size={14} className="text-slate-400 dark:text-slate-600" />
//             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Achievement Roadmap</h3>
//           </div>
//           <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{activeStakers} Active Stakers</span>
//         </div>

//         <div className="space-y-3">
//           {milestones.map((m) => {
//             const isCompleted = activeStakers >= m.requirement;
//             const progress = Math.min((activeStakers / m.requirement) * 100, 100);
            
//             return (
//               <div 
//                 key={m.id}
//                 className={`relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-[28px] border ${isCompleted ? 'border-green-100 dark:border-green-500/20 shadow-green-50 dark:shadow-none' : 'border-slate-100 dark:border-white/5 shadow-sm'} transition-all`}
//               >
//                 {isCompleted && (
//                   <div className="absolute top-0 right-0 p-3 text-green-500">
//                     <CheckCircle2 size={16} />
//                   </div>
//                 )}
                
//                 <div className="flex items-center gap-4 mb-4">
//                   <div className={`w-12 h-12 ${m.bg} rounded-2xl flex items-center justify-center shrink-0`}>
//                     {m.icon}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2">
//                       <h4 className={`text-sm font-black uppercase tracking-tight ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
//                         {m.name} {m.badge}
//                       </h4>
//                     </div>
//                     <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-widest">
//                       {isCompleted ? 'Unlocked' : `Requires ${m.requirement} Active Stakers`}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="flex justify-between items-center px-1">
//                     <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-300 dark:text-slate-700'}`}>
//                       {m.reward}
//                     </span>
//                     {!isCompleted && (
//                       <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase">
//                         {activeStakers}/{m.requirement}
//                       </span>
//                     )}
//                   </div>
                  
//                   <div className="relative h-2 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
//                     <div 
//                       className={`h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
//                       style={{ width: `${progress}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Quick Stats Summary */}
//       <div className="grid grid-cols-2 gap-4">
//          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-center space-y-1">
//             <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Total Invited</span>
//             <div className="text-xl font-black text-slate-900 dark:text-white">{referralCount}</div>
//          </div>
//          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-center space-y-1">
//             <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Active Yield</span>
//             <div className="text-xl font-black text-slate-900 dark:text-white">{activeStakers}</div>
//          </div>
//       </div>

//       {/* Security Info */}
//       <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[28px] border border-slate-200 dark:border-white/5 border-dashed flex items-center gap-4">
//         <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
//            <ShieldCheck className="text-slate-400 dark:text-slate-600" size={20} />
//         </div>
//         <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium leading-relaxed uppercase tracking-wider">
//           Anti-Bot verification: Only referrals who have completed at least one 24h staking session are counted towards milestone rewards.
//         </p>
//       </div>
//     </div>
//   );
// };
