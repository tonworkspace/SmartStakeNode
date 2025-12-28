// import React, { useState } from 'react';
// import { X, Plus, Minus, Zap, ArrowDownLeft } from 'lucide-react';
// import { TonPriceDisplay } from './TonPriceDisplay';
// import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
// import { toNano, beginCell } from '@ton/core';
// import { useTonPrice } from '@/hooks/useTonPrice';
// import { useAuth } from '@/hooks/useAuth';
// import { processDeposit, createStake } from '@/lib/supabaseClient';
// import { DEPOSIT_CONFIG, CURRENT_NETWORK, generateUniqueDepositId, isValidTonAddress } from '@/config/depositConfig';

// interface StakeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onDeposit: (amount: number) => void;
//   isLoading?: boolean;
// }

// export const StakeModal: React.FC<StakeModalProps> = ({
//   isOpen,
//   onClose,
//   onDeposit,
//   isLoading = false
// }) => {
//   const [amount, setAmount] = useState<string>('');
//   const [autoStake, setAutoStake] = useState<boolean>(true);
//   const [isTestMode, setIsTestMode] = useState<boolean>(false);
  
//   // Hooks for deposit functionality
//   const { user, updateUserData } = useAuth();
//   const [tonConnectUI] = useTonConnectUI();
//   const connectedAddress = useTonAddress();
//   const { tonPrice, change24h, isLoading: priceLoading, error: priceError, refreshPrice } = useTonPrice();

//   if (!isOpen) return null;

//   const numAmount = parseFloat(amount) || 0;
//   const isValidAmount = numAmount > 0;

//   // Calculate Daily ROI based on amount
//   const calculateDailyROI = (stakeAmount: number): number => {
//     let baseDailyROI = 0.01; // 1% base daily ROI
    
//     // Tier bonuses based on stake amount
//     if (stakeAmount >= 1000) baseDailyROI = 0.03; // 3% daily for 1000+ TON
//     else if (stakeAmount >= 500) baseDailyROI = 0.025; // 2.5% daily for 500+ TON
//     else if (stakeAmount >= 100) baseDailyROI = 0.02; // 2% daily for 100+ TON
//     else if (stakeAmount >= 50) baseDailyROI = 0.015; // 1.5% daily for 50+ TON
    
//     return baseDailyROI;
//   };

//   const projectedDailyROI = calculateDailyROI(numAmount);
//   const dailyEarnings = numAmount * projectedDailyROI;
//   const weeklyEarnings = dailyEarnings * 7;

//   // Handle test deposit (for development/testing)
//   const handleTestDeposit = async () => {
//     if (!user?.id || !amount) return;
    
//     const depositAmount = parseFloat(amount);
//     if (depositAmount <= 0) return;
    
//     try {
//       // Simulate deposit processing without actual blockchain transaction
//       const success = await processDeposit(user.id, depositAmount, `test_tx_${Date.now()}`);
      
//       if (success) {
//         // If auto-stake is enabled, automatically create stake
//         if (autoStake) {
//           const stakeData = {
//             user_id: user.id,
//             amount: depositAmount,
//             daily_rate: calculateDailyROI(depositAmount),
//             is_active: true,
//             cycle_progress: 0,
//             total_earned: 0,
//             created_at: new Date().toISOString(),
//             last_payout: new Date().toISOString()
//           };
          
//           await createStake(stakeData);
          
//           // Update user stake amount
//           await updateUserData({
//             stake: (user.stake || 0) + depositAmount,
//             stake_date: new Date().toISOString()
//           });
          
//           // Call parent callback
//           onDeposit(depositAmount);
//         } else {
//           // Just update balance if not auto-staking
//           await updateUserData({
//             balance: (user.balance || 0) + depositAmount
//           });
//         }
        
//         setAmount('');
//         onClose();
//       }
      
//     } catch (error) {
//       console.error('Error processing test deposit:', error);
//     }
//   };

//   // Handle direct deposit from wallet
//   const handleDirectDeposit = async () => {
//     if (!connectedAddress || !user?.id || !amount) return;
    
//     const depositAmount = parseFloat(amount);
//     if (depositAmount <= 0) return;

//     // Validate minimum amount
//     if (depositAmount < DEPOSIT_CONFIG.MIN_AMOUNT) {
//       console.error(`Minimum deposit amount is ${DEPOSIT_CONFIG.MIN_AMOUNT} TON`);
//       return;
//     }

//     // Validate deposit address
//     if (!isValidTonAddress(DEPOSIT_CONFIG.ADDRESS)) {
//       console.error('Invalid deposit address configuration');
//       return;
//     }
    
//     try {
//       // Generate unique deposit ID
//       const depositId = generateUniqueDepositId();
      
//       // Create a proper payload cell for the transaction
//       const payloadText = `deposit_${user.id}_${depositId}_${Date.now()}`;
//       const payloadCell = beginCell()
//         .storeUint(0, 32) // op code for text comment
//         .storeStringTail(payloadText)
//         .endCell();

//       // Create transaction for TON deposit using configured address
//       const transaction = {
//         validUntil: Math.floor(Date.now() / 1000) + DEPOSIT_CONFIG.TRANSACTION_TIMEOUT,
//         messages: [{
//           address: DEPOSIT_CONFIG.ADDRESS, // Use configured deposit address
//           amount: toNano(depositAmount).toString(),
//           payload: payloadCell.toBoc().toString('base64') // Properly encoded payload
//         }]
//       };
      
//       console.log(`Sending ${depositAmount} TON to ${DEPOSIT_CONFIG.ADDRESS} on ${CURRENT_NETWORK.NAME}`);
      
//       // Send transaction via TON Connect
//       const result = await tonConnectUI.sendTransaction(transaction);
      
//       if (result) {
//         // Process deposit in database with enhanced tracking
//         const success = await processDeposit(
//           user.id, 
//           depositAmount, 
//           result.boc || `tx_${depositId}_${Date.now()}`
//         );
        
//         if (success) {
//           // If auto-stake is enabled, automatically create stake
//           if (autoStake) {
//             const stakeData = {
//               user_id: user.id,
//               amount: depositAmount,
//               daily_rate: calculateDailyROI(depositAmount),
//               is_active: true,
//               cycle_progress: 0,
//               total_earned: 0,
//               created_at: new Date().toISOString(),
//               last_payout: new Date().toISOString()
//             };
            
//             await createStake(stakeData);
            
//             // Update user stake amount
//             await updateUserData({
//               stake: (user.stake || 0) + depositAmount,
//               stake_date: new Date().toISOString()
//             });
            
//             // Call parent callback
//             onDeposit(depositAmount);
//           } else {
//             // Just update balance if not auto-staking
//             await updateUserData({
//               balance: (user.balance || 0) + depositAmount
//             });
//           }
          
//           setAmount('');
//           onClose();
//         }
//       }
      
//     } catch (error) {
//       console.error('Error processing deposit:', error);
      
//       // Enhanced error handling
//       if (error instanceof Error) {
//         if (error.message.includes('user rejected')) {
//           console.error('Transaction was rejected by user');
//         } else if (error.message.includes('insufficient funds')) {
//           console.error('Insufficient funds in wallet');
//         } else {
//           console.error('Deposit failed:', error.message);
//         }
//       }
//     }
//   };

//   const handleSubmit = () => {
//     if (isValidAmount && !isLoading) {
//       if (isTestMode) {
//         handleTestDeposit();
//       } else {
//         handleDirectDeposit();
//       }
//       // Don't close modal here, let deposit handlers handle it
//     }
//   };

//   const adjustAmount = (delta: number) => {
//     const newAmount = Math.max(0, numAmount + delta);
//     setAmount(newAmount.toString());
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//       <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
//               <ArrowDownLeft size={20} className="text-blue-600 dark:text-blue-400" />
//             </div>
//             <h2 className="text-xl font-bold text-slate-900 dark:text-white">
//               Deposit & Stake TON
//             </h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//           >
//             <X size={20} className="text-slate-500" />
//           </button>
//         </div>

//         {/* Network & Connection Status */}
      
//         {/* Amount Input */}
//         <div className="mb-4">
//           <div className="flex items-center justify-between mb-2">
//             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
//               Deposit Amount (TON)
//             </label>
//           </div>
//           <div className="relative">
//             <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
//               <button
//                 onClick={() => adjustAmount(-1)}
//                 disabled={numAmount <= 1}
//                 className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Minus size={12} />
//               </button>
//             </div>
//             <input
//               type="number"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               placeholder="0.00"
//               className="w-full px-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold text-lg"
//             />
//             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
//               <button
//                 onClick={() => adjustAmount(1)}
//                 className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
//               >
//                 <Plus size={12} />
//               </button>
//               <span className="text-slate-500 font-bold text-sm">TON</span>
//             </div>
//           </div>
//           {!isValidAmount && numAmount > 0 && (
//             <p className="text-red-500 text-xs mt-1 font-medium">
//               Please enter a valid amount
//             </p>
//           )}
//         </div>

//         {/* Quick Amount Buttons */}
//         <div className="grid grid-cols-4 gap-2 mb-6">
//           {[1, 5, 10, 25].map((quickAmount) => (
//             <button
//               key={quickAmount}
//               onClick={() => setAmount(quickAmount.toString())}
//               className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
//             >
//               {quickAmount}
//             </button>
//           ))}
//         </div>

//         {/* Auto-Stake Toggle
//         <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 mb-6 border border-blue-100 dark:border-blue-500/20">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">Auto-Stake</p>
//               <p className="text-blue-600 dark:text-blue-400 text-xs">
//                 Automatically stake deposited TON
//               </p>
//             </div>
//             <button
//               onClick={() => setAutoStake(!autoStake)}
//               className={`w-12 h-6 rounded-full transition-colors ${
//                 autoStake ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
//               }`}
//             >
//               <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
//                 autoStake ? 'translate-x-6' : 'translate-x-0.5'
//               }`} />
//             </button>
//           </div>
//         </div> */}

//         {/* Test Mode Toggle (Development Only) */}
//         {process.env.NODE_ENV === 'development' && (
//           <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl p-4 mb-6 border border-yellow-100 dark:border-yellow-500/20">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">Test Mode</p>
//                 <p className="text-yellow-600 dark:text-yellow-400 text-xs">
//                   Enable test deposits without wallet connection
//                 </p>
//               </div>
//               <button
//                 onClick={() => setIsTestMode(!isTestMode)}
//                 className={`w-12 h-6 rounded-full transition-colors ${
//                   isTestMode ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-600'
//                 }`}
//               >
//                 <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
//                   isTestMode ? 'translate-x-6' : 'translate-x-0.5'
//                 }`} />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Staking Projections */}
//         {autoStake && numAmount > 0 && (
//           <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl p-4 mb-6 border border-blue-100 dark:border-blue-500/20">
//             <div className="flex items-center gap-2 mb-3">
//               <Zap size={16} className="text-blue-500" />
//               <span className="font-bold text-slate-900 dark:text-white text-sm">
//                 Staking Projections
//               </span>
//             </div>
//             <div className="space-y-2">
//               <div className="flex justify-between items-center">
//                 <span className="text-xs text-slate-600 dark:text-slate-400">Daily ROI Rate:</span>
//                 <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
//                   {(projectedDailyROI * 100).toFixed(1)}%
//                 </span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-xs text-slate-600 dark:text-slate-400">Daily Earnings:</span>
//                 <span className="font-bold text-slate-900 dark:text-white text-sm">
//                   {dailyEarnings.toFixed(6)} TON
//                 </span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-xs text-slate-600 dark:text-slate-400">Weekly Earnings:</span>
//                 <span className="font-bold text-green-600 dark:text-green-400 text-sm">
//                   {weeklyEarnings.toFixed(4)} TON
//                 </span>
//               </div>
//               {/* Real TON Price Display */}
//               <div className="pt-2 border-t border-blue-100 dark:border-blue-500/20">
//                 <TonPriceDisplay
//                   tonPrice={tonPrice}
//                   change24h={change24h}
//                   isLoading={priceLoading}
//                   error={priceError}
//                   onRefresh={refreshPrice}
//                   showEarnings={true}
//                   dailyEarnings={dailyEarnings}
//                   dailyUsdValue={(dailyEarnings * tonPrice).toFixed(4)}
//                   isStaking={true}
//                   className="text-xs"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Action Button */}
//         <button
//           onClick={handleSubmit}
//           disabled={!isValidAmount || isLoading || (!connectedAddress && !isTestMode)}
//           className={`w-full py-4 rounded-2xl font-bold text-white transition-all relative overflow-hidden ${
//             !isValidAmount || isLoading || (!connectedAddress && !isTestMode)
//               ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
//               : autoStake
//               ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:scale-95 shadow-lg shadow-green-500/25'
//               : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:scale-95 shadow-lg shadow-blue-500/25'
//           }`}
//         >
//           {isLoading ? (
//             <div className="flex items-center justify-center gap-2">
//               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               Processing...
//             </div>
//           ) : (
//             <div className="flex items-center justify-center gap-2">
//               <ArrowDownLeft size={18} />
//               {isTestMode ? 'Test Deposit' : 'Deposit TON'}
//               {autoStake && ' & Stake'}
//             </div>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// };