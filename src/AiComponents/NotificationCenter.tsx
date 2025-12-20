
// import React from 'react';
// import { X, Bell, Megaphone, TrendingUp, AlertCircle, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
// import { PlatformNotification } from '@/pages/IndexPage/IndexPage';
// import { toast } from 'react-hot-toast';

// interface NotificationCenterProps {
//   isOpen: boolean;
//   onClose: () => void;
//   notifications: PlatformNotification[];
//   onMarkRead: () => void;
// }

// export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, notifications, onMarkRead }) => {
//   const formatTime = (ts: number) => {
//     const diff = Date.now() - ts;
//     const minutes = Math.floor(diff / 60000);
//     if (minutes < 1) return 'Seconds ago';
//     if (minutes < 60) return `${minutes}m ago`;
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours}h ago`;
//     return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[100] flex justify-end">
//       {/* Backdrop */}
//       <div 
//         className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" 
//         onClick={onClose} 
//       />
      
//       {/* Institutional Sidebar Panel */}
//       <div className="relative w-full max-w-[320px] sm:max-w-sm bg-white dark:bg-[#0B1120] h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-200 dark:border-white/5">
//         <div className="px-6 py-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
//           <div className="flex items-center gap-4">
//             <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
//               <Bell size={24} />
//             </div>
//             <div>
//               <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">System Feed</h2>
//               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Protocol Events</p>
//             </div>
//           </div>
//           <button 
//             onClick={onClose}
//             className="p-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200 dark:border-white/5 transition-all active:scale-90"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white dark:bg-[#0B1120]">
//           {notifications.length > 0 ? (
//             notifications.map((notif) => (
//               <div 
//                 key={notif.id} 
//                 className={`p-5 rounded-[28px] border transition-all duration-300 ${
//                   notif.isRead 
//                   ? 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-60' 
//                   : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 shadow-sm'
//                 }`}
//               >
//                 <div className="flex items-start gap-4">
//                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
//                     notif.type === 'announcement' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' :
//                     notif.type === 'market' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
//                     'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
//                   }`}>
//                     {notif.type === 'announcement' ? <Megaphone size={18} /> :
//                      notif.type === 'market' ? <TrendingUp size={18} /> :
//                      <AlertCircle size={18} />}
//                   </div>
//                   <div className="space-y-1 flex-1">
//                     <div className="flex justify-between items-start">
//                       <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight pr-2">
//                         {notif.title}
//                       </h4>
//                     </div>
//                     <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
//                       {notif.message}
//                     </p>
//                     <div className="flex items-center gap-1.5 pt-2">
//                        <Calendar size={10} className="text-slate-400" />
//                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
//                         {formatTime(notif.timestamp)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
//               <Calendar size={48} className="text-slate-200 dark:text-slate-800 mb-5" />
//               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">All Nodes Synchronized</p>
//             </div>
//           )}
//         </div>

//         <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0B1120]/50 space-y-4">
//           <button 
//             onClick={() => {
//               onMarkRead();
//               toast.success("Feed Cleared", { icon: '🛡️' });
//             }}
//             className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
//           >
//             <CheckCircle2 size={16} /> Acknowledge All
//           </button>
//           <div className="flex items-center justify-center gap-2">
//              <ShieldCheck size={12} className="text-blue-500" />
//              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Secure Transmission</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
