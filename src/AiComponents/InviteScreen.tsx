
// import React from 'react';
// import { Users, Copy, Share2, Globe, Zap, ShieldCheck } from 'lucide-react';
// import { toast } from 'react-hot-toast';
// import { CONSTANTS } from '@/pages/IndexPage/IndexPage';

// interface InviteScreenProps {
//   address: string | null;
//   telegramId?: number;
//   referrals: any[];
//   onSimulateJoin: () => void;
// }

// export const InviteScreen: React.FC<InviteScreenProps> = ({ address, telegramId, referrals, onSimulateJoin }) => {
//   // Mini App standard: startapp param
//   const referralKey = telegramId ? telegramId.toString() : (address?.slice(0, 8) || '000000');
//   const referralLink = `https://t.me/${CONSTANTS.BOT_USERNAME}?startapp=${referralKey}`;
  
//   const activeNodes = referrals.length;
//   const targetGoal = 50;
//   const progress = Math.min((activeNodes / targetGoal) * 100, 100);

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(referralLink);
//     toast.success("Referral Link Copied", { icon: '🔐' });
//   };

//   const handleShare = () => {
//     const text = `Join my SmartStake AI node and earn 15% APY on TON! 🚀\n\n${referralLink}`;
//     const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
//     window.open(url, '_blank');
//   };

//   return (
//     <div className="flex flex-col space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      
//       <div className="space-y-1">
//         <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Team Protocol</h2>
//         <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Network Expansion Dashboard</p>
//       </div>

//       <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200/60 dark:border-white/5 shadow-sm space-y-6 relative overflow-hidden group">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-10 -mt-10" />
        
//         <div className="flex items-center gap-4">
//           <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
//              <Globe size={24} />
//           </div>
//           <div className="space-y-0.5">
//             <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Inbound Gateway</h3>
//             <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Unique Node Link</p>
//           </div>
//         </div>

//         <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 transition-all">
//            <span className="flex-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate tabular-nums">{referralLink}</span>
//            <button 
//             onClick={copyToClipboard}
//             className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm transition-all active:scale-90"
//            >
//              <Copy size={16} />
//            </button>
//         </div>

//         <div className="grid grid-cols-2 gap-3">
//           <button 
//             onClick={handleShare}
//             className="py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
//           >
//             <Share2 size={16} /> Broadcast
//           </button>
//           <button 
//             onClick={onSimulateJoin}
//             className="py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-white/10 shadow-sm transition-all active:scale-95"
//           >
//             Simulate Join
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4 w-full">
//         <div className="bg-white/60 dark:bg-slate-900/50 p-5 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl flex flex-col items-center text-center">
//           <Users size={20} className="text-blue-500 mb-3" />
//           <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Downline Count</span>
//           <span className="text-slate-900 dark:text-white font-black text-xl">{activeNodes} <span className="text-[10px] font-bold opacity-30 uppercase">Nodes</span></span>
//         </div>
        
//         <div className="bg-white/60 dark:bg-slate-900/50 p-5 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-xl flex flex-col items-center text-center">
//           <Zap size={20} className="text-amber-500 mb-3" />
//           <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Network Bonus</span>
//           <span className="text-slate-900 dark:text-white font-black text-xl">+{ (activeNodes * 0.05).toFixed(2) }x <span className="text-[10px] font-bold opacity-30 uppercase">Boost</span></span>
//         </div>
//       </div>

//       <div className="bg-slate-900 p-6 rounded-[32px] space-y-6 text-white shadow-2xl relative overflow-hidden border dark:border-white/10">
//         <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
        
//         <div className="space-y-4 relative z-10">
//            <div className="flex justify-between items-center">
//               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Yield Milestone</h3>
//               <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Phase 2 Gate</div>
//            </div>

//            <div className="flex justify-between items-baseline">
//               <div className="text-3xl font-black">{activeNodes} / 50 <span className="text-xs font-bold opacity-40">NODES</span></div>
//               <div className="text-emerald-400 font-black text-sm">{progress.toFixed(0)}%</div>
//            </div>

//            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
//               <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
//            </div>
           
//            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
//               <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
//               <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
//                 Referral bonuses activate after your node partners complete their first <span className="text-white font-bold">5 TON</span> stake.
//               </p>
//            </div>
//         </div>
//       </div>

//       <div className="space-y-4">
//         <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-1">Network Feed</h3>
//         <div className="space-y-2.5">
//           {referrals.length > 0 ? (
//             referrals.map((ref) => (
//               <div key={ref.id} className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center justify-between animate-in slide-in-from-left duration-300">
//                 <div className="flex items-center gap-4">
//                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-xs uppercase">
//                     {ref.username.charAt(0)}
//                   </div>
//                   <div>
//                     <div className="text-slate-900 dark:text-white text-[12px] font-black tracking-tight">@{ref.username}</div>
//                     <div className="text-blue-500 text-[9px] font-bold mt-0.5 uppercase tracking-widest">Active Partner</div>
//                   </div>
//                 </div>
//                 <div className="text-[12px] font-black text-emerald-500 tabular-nums">
//                   +0.05x
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="py-12 text-center opacity-30 flex flex-col items-center">
//               <Users size={40} className="mb-3" />
//               <p className="text-[11px] font-black uppercase tracking-[0.2em]">No Active Nodes Found</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
