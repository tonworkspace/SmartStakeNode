
// import React, { useState, useEffect } from 'react';
// import { ShieldCheck, Zap, ArrowRight, Check, Sparkles, Database } from 'lucide-react';
// import { UserAvatar } from './UserAvatar';

// interface OnboardingWizardProps {
//   onComplete: (username: string) => void;
//   initialUsername?: string;
// }

// export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, initialUsername = '' }) => {
//   const [step, setStep] = useState(1);
//   const [username, setUsername] = useState(initialUsername);
//   const [isAgreed, setIsAgreed] = useState(false);

//   useEffect(() => {
//     if (initialUsername) {
//       setUsername(initialUsername);
//     }
//   }, [initialUsername]);

//   const steps = [
//     { title: 'Identity' },
//     { title: 'Security' },
//     { title: 'Mission' }
//   ];

//   const handleNext = () => {
//     if (step < 3) {
//       setStep(step + 1);
//     } else {
//       onComplete(username || 'AnonymousStaker');
//     }
//   };

//   return (
//     <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500 max-w-sm mx-auto w-full px-2">
      
//       {/* Progress Tracker */}
//       <div className="flex items-center gap-2">
//         {steps.map((_, index) => (
//           <div key={index} className="flex items-center">
//             <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
//               step >= index + 1 ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
//             }`}>
//               {step > index + 1 ? <Check size={14} /> : (index === 0 ? <UserAvatar username={username || "S"} size="sm" /> : <Zap size={14} />)}
//             </div>
//             {index < steps.length - 1 && (
//               <div className={`w-6 h-0.5 mx-1 rounded-full ${step > index + 1 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Wizard Content */}
//       <div className="w-full bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border dark:border-white/5 space-y-6 relative overflow-hidden">
//         {step === 1 && (
//           <div className="space-y-6 animate-in slide-in-from-right duration-300">
//             <div className="text-center space-y-2">
//               <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Create Account</h2>
//               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Choose your network handle</p>
//             </div>

//             {/* Live Preview Avatar */}
//             <div className="flex justify-center py-2">
//                <div className="relative group">
//                  <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
//                  <UserAvatar username={username || "S"} size="xl" className="ring-4 ring-slate-50 dark:ring-slate-800 shadow-xl" />
//                </div>
//             </div>
            
//             <div className="space-y-4">
//               <div className="relative">
//                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</div>
//                 <input
//                   type="text"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
//                   placeholder="Username"
//                   className="w-full bg-slate-50 dark:bg-slate-800 py-4 pl-10 pr-4 rounded-2xl outline-none border-2 border-transparent focus:border-green-500/30 dark:text-white text-sm font-bold transition-all"
//                 />
//               </div>
//               <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed italic text-center">
//                 {initialUsername ? 'Telegram identity detected.' : 'Your avatar is uniquely generated based on your handle.'}
//               </p>
//             </div>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="space-y-6 animate-in slide-in-from-right duration-300">
//             <div className="text-center space-y-2">
//               <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Smart Security</h2>
//               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Sign network agreement</p>
//             </div>

//             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-3">
//               <div className="flex items-start gap-3">
//                 <Database size={14} className="text-green-500 shrink-0 mt-0.5" />
//                 <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider leading-relaxed">Non-Custodial: Your keys, your crypto.</p>
//               </div>
//               <div className="flex items-start gap-3">
//                 <ShieldCheck size={14} className="text-blue-500 shrink-0 mt-0.5" />
//                 <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider leading-relaxed">Encrypted: All mining logic is handled by verified smart contracts.</p>
//               </div>
//             </div>

//             <button 
//               onClick={() => setIsAgreed(!isAgreed)}
//               className="flex items-center gap-3 w-full text-left"
//             >
//               <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isAgreed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
//                 {isAgreed && <Check size={12} />}
//               </div>
//               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">I agree to the network terms</span>
//             </button>
//           </div>
//         )}

//         {step === 3 && (
//           <div className="space-y-6 animate-in slide-in-from-right duration-300">
//             <div className="text-center space-y-2">
//               <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Ready to Mine</h2>
//               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Ecosystem launch imminent</p>
//             </div>

//             <div className="relative group flex items-center justify-center py-4">
//                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-75 animate-pulse" />
//                <div className="relative z-10">
//                   <UserAvatar username={username} size="xl" className="ring-4 ring-white dark:ring-slate-800 shadow-2xl" />
//                   <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
//                     <Sparkles size={16} />
//                   </div>
//                </div>
//             </div>

//             <div className="space-y-3 text-center">
//               <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">Phase 1 Genesis Active</div>
//               <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
//                 Stake TON &middot; Mine SmartAI &middot; 15% APY
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Action Button */}
//         <button 
//           onClick={handleNext}
//           disabled={(step === 1 && !username) || (step === 2 && !isAgreed)}
//           className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-20 border dark:border-white/5"
//         >
//           {step === 3 ? 'Start Earning' : 'Next Step'}
//           <ArrowRight size={14} />
//         </button>
//       </div>

//       <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-center px-4 leading-relaxed">
//         Securely on-boarding to The Open Network &middot; SmartStake Protocol v1.0
//       </p>
//     </div>
//   );
// };
