
// import React, { useState, useRef } from 'react';
// import { X, LogOut, ChevronRight, Copy, Check, ShieldCheck, Download, Upload, ShieldAlert, FileJson, AlertCircle, FileUp, Hash, UserCircle } from 'lucide-react';
// import { UserProfile, CONSTANTS } from '@/pages/IndexPage/IndexPage';
// import { UserAvatar } from './UserAvatar';
// import { toast } from 'react-hot-toast';

// interface UserProfileModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   profile: UserProfile | null;
//   address: string | null;
//   stakedAmount: number;
//   claimedAmount: number;
//   onDisconnect: () => void;
//   onRestore: (data: string) => void;
// }

// export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   profile, 
//   address, 
//   stakedAmount, 
//   onDisconnect,
//   onRestore
// }) => {
//   const [copied, setCopied] = useState(false);
//   const [showRestorePanel, setShowRestorePanel] = useState(false);
//   const [restoreValue, setRestoreValue] = useState('');
//   const [pendingBackup, setPendingBackup] = useState<any>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   if (!isOpen) return null;

//   const formatDate = (ts: number) => {
//     return new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
//   };

//   const handleCopy = () => {
//     if (address) {
//       navigator.clipboard.writeText(address);
//       setCopied(true);
//       toast.success("Address copied!", { id: 'addr-copy' });
//       setTimeout(() => setCopied(false), 2000);
//     }
//   };

//   const handleExport = () => {
//     const data = localStorage.getItem(CONSTANTS.STORAGE_KEY);
//     if (data) {
//       navigator.clipboard.writeText(data);
//       toast.success("Vault Key Copied!", { icon: '🔐' });
//       const blob = new Blob([data], { type: 'application/json' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `SmartStake_Backup_${profile?.username || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
//       a.click();
//       URL.revokeObjectURL(url);
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const content = event.target?.result as string;
//       try {
//         const parsed = JSON.parse(content);
//         if (!parsed.profile) throw new Error();
//         setPendingBackup(parsed);
//         setRestoreValue(content);
//       } catch (e) {
//         toast.error("Invalid Backup File");
//       }
//     };
//     reader.readAsText(file);
//   };

//   return (
//     <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-6 overflow-hidden">
//       <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-500 cursor-pointer" onClick={onClose} />
      
//       <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[48px] shadow-2xl animate-in slide-in-from-bottom duration-500 flex flex-col border-t sm:border dark:border-white/5 overflow-hidden max-h-[94vh]">
//         <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none opacity-50`} />

//         <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all active:scale-90 border border-transparent hover:border-slate-200 dark:hover:border-white/10">
//           <X size={20} />
//         </button>

//         <div className="px-6 sm:px-10 pt-10 pb-12 space-y-8 relative z-10 overflow-y-auto custom-scrollbar">
//           {/* Identity Header */}
//           <div className="flex flex-col items-center text-center space-y-4">
//             <div className="relative">
//               <UserAvatar username={profile?.username || "S"} size="xl" className="shadow-2xl ring-8 ring-white dark:ring-slate-900/50" />
//               <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full bg-blue-500 text-white border border-white dark:border-slate-800 text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1`}>
//                 <ShieldCheck size={10} /> Verified
//               </div>
//             </div>
//             <div className="space-y-1">
//               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">@{profile?.username || 'Anonymous'}</h2>
//               <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-white/5 transition-all active:scale-95 group">
//                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums uppercase tracking-widest">{address?.slice(0, 10)}...{address?.slice(-4)}</span>
//                 {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
//               </button>
//             </div>
//           </div>

//           {/* Telegram Identity Card */}
//           <div className="space-y-3">
//              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-2">Telegram Identity</h3>
//              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[32px] border border-slate-100 dark:border-white/5 grid grid-cols-1 gap-4">
//                 <div className="flex items-center justify-between px-1">
//                    <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
//                          <UserCircle size={18} />
//                       </div>
//                       <div className="flex flex-col">
//                         <span className="text-[9px] font-black text-slate-400 uppercase">Full Name</span>
//                         <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{profile?.firstName} {profile?.lastName || ''}</span>
//                       </div>
//                    </div>
//                    <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-lg">
//                       <ShieldCheck size={10} />
//                       <span className="text-[8px] font-black uppercase">Sync OK</span>
//                    </div>
//                 </div>

//                 <div className="flex items-center justify-between px-1 border-t border-slate-200/50 dark:border-white/5 pt-4">
//                    <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded-xl bg-slate-900/5 dark:bg-white/5 text-slate-400 flex items-center justify-center">
//                          <Hash size={18} />
//                       </div>
//                       <div className="flex flex-col">
//                         <span className="text-[9px] font-black text-slate-400 uppercase">Telegram ID</span>
//                         <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{profile?.telegramId || 'Unavailable'}</span>
//                       </div>
//                    </div>
//                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
//                       Lang: {profile?.languageCode?.toUpperCase() || 'EN'}
//                    </div>
//                 </div>
//              </div>
//           </div>

//           {/* Efficiency & Protocol Stats */}
//           <div className="bg-blue-900 dark:bg-blue-600 p-6 rounded-[32px] shadow-xl text-white space-y-4 relative overflow-hidden">
//              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
//              <div className="flex justify-between items-center relative z-10">
//                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Protocol Membership</span>
//                 <span className="text-[9px] font-black uppercase tracking-widest">Est. {formatDate(profile?.joinedAt || Date.now())}</span>
//              </div>
//              <div className="flex justify-between items-end relative z-10">
//                 <div className="space-y-1">
//                    <div className="text-3xl font-black tabular-nums">{stakedAmount.toFixed(1)} <span className="text-xs opacity-50">TON</span></div>
//                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Active Allocation</div>
//                 </div>
//                 <div className="text-right space-y-1">
//                    <div className="text-xl font-black text-emerald-400">OPTIMAL</div>
//                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Node Status</div>
//                 </div>
//              </div>
//           </div>

//           {/* Protocol Vault (User Friendly Backup Section) */}
//           <div className="space-y-4">
//             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-2">Protocol Vault</h3>
            
//             {!showRestorePanel ? (
//               <div className="grid grid-cols-1 gap-3">
//                  <button 
//                   onClick={handleExport}
//                   className="w-full bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center justify-between group"
//                  >
//                    <div className="flex items-center gap-4">
//                       <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
//                         <Download size={20} />
//                       </div>
//                       <div className="text-left">
//                         <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Export Backup</div>
//                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Save Protocol State</p>
//                       </div>
//                    </div>
//                    <ChevronRight size={16} className="text-slate-300" />
//                  </button>

//                  <button 
//                   onClick={() => setShowRestorePanel(true)}
//                   className="w-full bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200/60 dark:border-white/5 shadow-sm flex items-center justify-between group"
//                  >
//                    <div className="flex items-center gap-4">
//                       <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
//                         <Upload size={20} />
//                       </div>
//                       <div className="text-left">
//                         <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Import Session</div>
//                         <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Recover from File</p>
//                       </div>
//                    </div>
//                    <ChevronRight size={16} className="text-slate-300" />
//                  </button>
//               </div>
//             ) : (
//               <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[32px] border-2 border-dashed border-blue-500/30 animate-in zoom-in duration-300 space-y-5">
//                 <div className="flex justify-between items-center">
//                    <div className="flex items-center gap-2">
//                      <FileJson size={18} className="text-blue-500" />
//                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Recovery Center</span>
//                    </div>
//                    <button onClick={() => { setShowRestorePanel(false); setPendingBackup(null); }} className="text-[10px] font-black text-slate-400 uppercase">Cancel</button>
//                 </div>

//                 {!pendingBackup ? (
//                   <div className="space-y-4">
//                     <button 
//                       onClick={() => fileInputRef.current?.click()}
//                       className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group"
//                     >
//                        <FileUp size={32} className="text-slate-300 group-hover:text-blue-500" />
//                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Upload .JSON Backup</span>
//                     </button>
//                     <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                    
//                     <textarea 
//                       value={restoreValue}
//                       onChange={(e) => setRestoreValue(e.target.value)}
//                       placeholder="Or paste private vault key..."
//                       className="w-full bg-white dark:bg-slate-900 border dark:border-white/10 rounded-2xl p-4 text-[10px] font-mono outline-none h-20 focus:border-blue-500 transition-all dark:text-white"
//                     />
//                   </div>
//                 ) : (
//                   <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-blue-500/20 space-y-4 animate-in slide-in-from-bottom duration-300">
//                     <div className="flex items-center gap-4">
//                        <UserAvatar username={pendingBackup.profile.username} size="md" />
//                        <div>
//                           <div className="text-xs font-black text-slate-900 dark:text-white uppercase">@{pendingBackup.profile.username}</div>
//                           <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Stored State: {pendingBackup.staked} TON</div>
//                        </div>
//                     </div>
//                     <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
//                        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
//                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
//                          Overwriting current session with backup state.
//                        </p>
//                     </div>
//                     <button 
//                       onClick={() => onRestore(restoreValue)}
//                       className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
//                     >
//                       <ShieldAlert size={14} /> Finalize Restore
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Danger Zone */}
//           <div className="space-y-4">
//             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] px-2">Protocol Access</h3>
//             <button onClick={onDisconnect} className="w-full bg-red-50/50 dark:bg-red-500/5 p-5 rounded-3xl flex items-center justify-between group transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20 active:scale-[0.98]">
//               <div className="flex items-center gap-4">
//                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 text-red-500 flex items-center justify-center shadow-sm">
//                     <LogOut size={20} />
//                  </div>
//                  <div className="text-left">
//                    <div className="text-xs font-black text-red-500 uppercase tracking-widest">Revoke Access</div>
//                    <div className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase mt-0.5">Flush Local Credentials</div>
//                  </div>
//               </div>
//               <ChevronRight size={16} className="text-red-300" />
//             </button>
//           </div>

//           <div className="text-center pt-4">
//              <div className="flex items-center justify-center gap-2">
//                <ShieldCheck size={12} className="text-slate-300 dark:text-slate-700" />
//                <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-none">SmartStake Protocol v1.8 &middot; Institutional Grade</span>
//              </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
