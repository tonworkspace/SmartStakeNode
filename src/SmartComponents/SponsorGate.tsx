// import React, { useState } from 'react';
// import { Users, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
// import { supabase } from '@/lib/supabaseClient';
// import { toast } from 'react-hot-toast';

// interface SponsorGateProps {
//   userId: string;
//   onSuccess: () => void;
// }

// export const SponsorGate: React.FC<SponsorGateProps> = ({ userId, onSuccess }) => {
//   const [code, setCode] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const handleApplySponsorCode = async () => {
//     if (!code.trim()) {
//       toast.error("Please enter a sponsor code");
//       return;
//     }

//     setIsLoading(true);
//     const toastId = toast.loading("Verifying Sponsor...");

//     try {
//       // 1. Validate: Cannot sponsor self
//       if (code === userId) {
//         throw new Error("You cannot use your own code.");
//       }

//       // 2. Find Sponsor in DB (Search by ID, Telegram ID, or Wallet)
//       // Note: Adjust column names based on your exact DB schema
//       const { data: sponsor, error: sponsorErr } = await supabase
//         .from('users')
//         .select('id, username, telegram_id')
//         .or(`id.eq.${code},telegram_id.eq.${code},wallet_address.eq.${code}`)
//         .maybeSingle();

//       if (sponsorErr || !sponsor) {
//         throw new Error("Sponsor not found. Please check the code.");
//       }

//       if (sponsor.id === userId) {
//         throw new Error("You cannot use your own account as a sponsor.");
//       }

//       // 3. Check for existing referral (Prevent duplicates)
//       const { data: existing } = await supabase
//         .from('referrals')
//         .select('id')
//         .eq('referred_id', userId)
//         .maybeSingle();

//       if (existing) {
//         throw new Error("You already have a sponsor.");
//       }

//       // 4. Check for Circular Reference (A -> B -> A)
//       const { data: reverseCheck } = await supabase
//         .from('referrals')
//         .select('id')
//         .eq('sponsor_id', userId)
//         .eq('referred_id', sponsor.id)
//         .maybeSingle();

//       if (reverseCheck) {
//         throw new Error("Circular referral detected. Cannot join this team.");
//       }

//       // 5. Create Referral Record
//       const { error: insertErr } = await supabase
//         .from('referrals')
//         .insert({
//           sponsor_id: sponsor.id,
//           referred_id: userId,
//           status: 'active',
//           created_at: new Date().toISOString()
//         });

//       if (insertErr) throw insertErr;

//       // 6. Update User Record
//       const { error: updateErr } = await supabase
//         .from('users')
//         .update({ sponsor_id: sponsor.id })
//         .eq('id', userId);

//       if (updateErr) throw updateErr;

//       // 7. Success!
//       toast.success(`Joined ${sponsor.username || 'User ' + sponsor.id}'s Team!`, { id: toastId });
//       onSuccess(); // Unblocks the parent UI

//     } catch (error: any) {
//       console.error(error);
//       toast.error(error.message || "Failed to join team", { id: toastId });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 min-h-[80vh] animate-in fade-in zoom-in duration-500">
//       <div className="max-w-sm w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
        
//         {/* Background Decoration */}
//         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
        
//         <div className="flex flex-col items-center text-center space-y-6">
          
//           {/* Icon */}
//           <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2 relative group">
//             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse group-hover:bg-blue-500/30 transition-all" />
//             <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 relative z-10" />
//             <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm">
//               <ShieldAlert size={14} className="text-amber-500" />
//             </div>
//           </div>

//           {/* Header */}
//           <div className="space-y-2">
//             <h2 className="text-2xl font-black text-slate-900 dark:text-white">
//               Invitation Required
//             </h2>
//             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
//               To ensure the quality of our network, new miners must be invited by an existing member.
//             </p>
//           </div>

//           {/* Input Area */}
//           <div className="w-full space-y-3">
//             <input
//               type="text"
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               placeholder="Enter Sponsor ID / Wallet"
//               className="w-full px-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
//             />
            
//             <button
//               onClick={handleApplySponsorCode}
//               disabled={isLoading || !code}
//               className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.98]
//                 ${isLoading || !code 
//                   ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
//                   : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
//                 }`}
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="animate-spin" size={20} />
//                   <span>Verifying...</span>
//                 </>
//               ) : (
//                 <>
//                   <span>Join Team</span>
//                   <ArrowRight size={20} />
//                 </>
//               )}
//             </button>
//           </div>

//           {/* Footer Helper */}
//           <div className="pt-2">
//             <p className="text-xs text-slate-400">
//               Don't have a code? <br />
//               <span className="text-blue-500 cursor-pointer hover:underline">
//                 Ask in the Community Channel
//               </span>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };