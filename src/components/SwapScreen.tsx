// import React, { useState, useEffect } from 'react';
// import { 
//   ArrowUpDown, 
//   Zap, 
//   TrendingUp, 
//   Clock, 
//   Shield, 
//   Info,
//   ChevronDown,
//   Loader2,
//   CheckCircle2,
//   AlertTriangle
// } from 'lucide-react';
// import { useTonPrice } from '@/hooks/useTonPrice';
// import { useAuth } from '@/hooks/useAuth';
// import { supabase } from '@/lib/supabaseClient';

// interface Token {
//   id: string;
//   symbol: string;
//   name: string;
//   icon: string;
//   balance: number;
//   price: number;
//   color: string;
// }

// interface SwapScreenProps {
//   showSnackbar: (config: { message: string; description?: string }) => void;
// }

// const SwapScreen: React.FC<SwapScreenProps> = ({ showSnackbar }) => {
//   const { user } = useAuth();
//   const { tonPrice } = useTonPrice();
  
//   // State
//   const [fromToken, setFromToken] = useState<Token | null>(null);
//   const [toToken, setToToken] = useState<Token | null>(null);
//   const [fromAmount, setFromAmount] = useState<string>('');
//   const [toAmount, setToAmount] = useState<string>('');
//   const [isSwapping, setIsSwapping] = useState(false);
//   const [showFromDropdown, setShowFromDropdown] = useState(false);
//   const [showToDropdown, setShowToDropdown] = useState(false);
//   const [userBalances, setUserBalances] = useState<{ [key: string]: number }>({});
//   const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage

//   // Available tokens
//   const availableTokens: Token[] = [
//     {
//       id: 'ton',
//       symbol: 'TON',
//       name: 'Toncoin',
//       icon: '💎',
//       balance: userBalances.ton || 0,
//       price: tonPrice,
//       color: 'from-blue-500 to-cyan-500'
//     },
//     {
//       id: 'sbt',
//       symbol: 'SBT',
//       name: 'Smart Balance Token',
//       icon: '⭐',
//       balance: userBalances.sbt || 0,
//       price: tonPrice * 0.1, // SBT is 10% of TON price
//       color: 'from-purple-500 to-pink-500'
//     },
//     {
//       id: 'usdt',
//       symbol: 'USDT',
//       name: 'Tether USD',
//       icon: '💵',
//       balance: userBalances.usdt || 0,
//       price: 1.0,
//       color: 'from-green-500 to-emerald-500'
//     },
//     {
//       id: 'stake',
//       symbol: 'STAKE',
//       name: 'Staked TON',
//       icon: '🔥',
//       balance: userBalances.stake || 0,
//       price: tonPrice * 1.05, // STAKE is 5% premium
//       color: 'from-orange-500 to-red-500'
//     }
//   ];

//   // Load user balances
//   useEffect(() => {
//     const loadBalances = async () => {
//       if (!user?.id) return;
      
//       try {
//         const { data: userData } = await supabase
//           .from('users')
//           .select('balance, total_sbt, stake')
//           .eq('id', user.id)
//           .single();
        
//         if (userData) {
//           setUserBalances({
//             ton: Number(userData.balance) || 0,
//             sbt: Number(userData.total_sbt) || 0,
//             stake: Number(userData.stake) || 0,
//             usdt: 0 // Placeholder for USDT balance
//           });
//         }
//       } catch (error) {
//         console.error('Failed to load balances:', error);
//       }
//     };

//     loadBalances();
//   }, [user?.id]);

//   // Set default tokens
//   useEffect(() => {
//     if (availableTokens.length > 0 && !fromToken) {
//       setFromToken(availableTokens[0]); // TON
//       setToToken(availableTokens[1]); // SBT
//     }
//   }, [availableTokens.length]);

//   // Calculate exchange rate and amounts
//   useEffect(() => {
//     if (fromToken && toToken && fromAmount) {
//       const fromValue = parseFloat(fromAmount) * fromToken.price;
//       const toAmountCalculated = fromValue / toToken.price;
//       const slippageAmount = toAmountCalculated * (slippage / 100);
//       const finalAmount = toAmountCalculated - slippageAmount;
//       setToAmount(finalAmount.toFixed(6));
//     } else if (!fromAmount) {
//       setToAmount('');
//     }
//   }, [fromAmount, fromToken, toToken, slippage]);

//   // Swap tokens
//   const handleSwapTokens = () => {
//     const tempToken = fromToken;
//     const tempAmount = fromAmount;
    
//     setFromToken(toToken);
//     setToToken(tempToken);
//     setFromAmount(toAmount);
//     setToAmount(tempAmount);
//   };

//   // Execute swap
//   const handleSwap = async () => {
//     if (!fromToken || !toToken || !fromAmount || !user?.id) {
//       showSnackbar({
//         message: 'Invalid Swap',
//         description: 'Please select tokens and enter an amount'
//       });
//       return;
//     }

//     const amount = parseFloat(fromAmount);
//     if (amount <= 0 || amount > fromToken.balance) {
//       showSnackbar({
//         message: 'Insufficient Balance',
//         description: `You don't have enough ${fromToken.symbol}`
//       });
//       return;
//     }

//     setIsSwapping(true);
    
//     try {
//       // Simulate swap transaction
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       // Record swap activity
//       const { error: activityError } = await supabase
//         .from('activities')
//         .insert({
//           user_id: user.id,
//           type: 'swap',
//           amount: amount,
//           status: 'completed',
//           created_at: new Date().toISOString(),
//           metadata: {
//             from_token: fromToken.symbol,
//             to_token: toToken.symbol,
//             from_amount: amount,
//             to_amount: parseFloat(toAmount),
//             exchange_rate: fromToken.price / toToken.price,
//             slippage: slippage
//           }
//         });

//       if (activityError) {
//         console.error('Failed to record swap activity:', activityError);
//       }

//       showSnackbar({
//         message: 'Swap Successful! 🎉',
//         description: `Swapped ${amount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`
//       });

//       // Reset form
//       setFromAmount('');
//       setToAmount('');
      
//     } catch (error) {
//       console.error('Swap failed:', error);
//       showSnackbar({
//         message: 'Swap Failed',
//         description: 'Please try again later'
//       });
//     } finally {
//       setIsSwapping(false);
//     }
//   };

//   // Token selector component
//   const TokenSelector = ({ 
//     token, 
//     isOpen, 
//     onToggle, 
//     onSelect, 
//     excludeToken 
//   }: {
//     token: Token | null;
//     isOpen: boolean;
//     onToggle: () => void;
//     onSelect: (token: Token) => void;
//     excludeToken?: Token | null;
//   }) => (
//     <div className="relative">
//       <button
//         onClick={onToggle}
//         className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 min-w-[140px]"
//       >
//         {token ? (
//           <>
//             <span className="text-2xl">{token.icon}</span>
//             <div className="flex flex-col items-start">
//               <span className="font-bold text-slate-900 dark:text-white">{token.symbol}</span>
//               <span className="text-xs text-slate-500 dark:text-slate-400">
//                 {token.balance.toFixed(4)}
//               </span>
//             </div>
//           </>
//         ) : (
//           <span className="text-slate-500 dark:text-slate-400">Select Token</span>
//         )}
//         <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//       </button>

//       {isOpen && (
//         <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
//           {availableTokens
//             .filter(t => t.id !== excludeToken?.id)
//             .map((tokenOption) => (
//               <button
//                 key={tokenOption.id}
//                 onClick={() => {
//                   onSelect(tokenOption);
//                   onToggle();
//                 }}
//                 className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
//               >
//                 <span className="text-2xl">{tokenOption.icon}</span>
//                 <div className="flex flex-col items-start">
//                   <span className="font-bold text-slate-900 dark:text-white">{tokenOption.symbol}</span>
//                   <span className="text-xs text-slate-500 dark:text-slate-400">
//                     {tokenOption.name}
//                   </span>
//                   <span className="text-xs text-green-600 dark:text-green-400">
//                     Balance: {tokenOption.balance.toFixed(4)}
//                   </span>
//                 </div>
//                 <div className="ml-auto text-right">
//                   <div className="text-sm font-medium text-slate-900 dark:text-white">
//                     ${tokenOption.price.toFixed(4)}
//                   </div>
//                 </div>
//               </button>
//             ))}
//         </div>
//       )}
//     </div>
//   );

//   const exchangeRate = fromToken && toToken ? (fromToken.price / toToken.price).toFixed(6) : '0';
//   const priceImpact = 0.1; // Simulated price impact

//   return (
//     <div className="flex flex-col space-y-6 animate-in slide-in-from-right duration-500 pb-10">
//       {/* Header */}
//       <div className="space-y-1">
//         <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
//           Token Swap
//         </h2>
//         <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">
//           Exchange tokens instantly with best rates
//         </p>
//       </div>

//       {/* Swap Card */}
//       <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-lg p-6 space-y-6">
        
//         {/* From Token */}
//         <div className="space-y-3">
//           <div className="flex items-center justify-between">
//             <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
//               From
//             </label>
//             {fromToken && (
//               <button
//                 onClick={() => setFromAmount(fromToken.balance.toString())}
//                 className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
//               >
//                 Max: {fromToken.balance.toFixed(4)}
//               </button>
//             )}
//           </div>
          
//           <div className="flex items-center gap-4">
//             <TokenSelector
//               token={fromToken}
//               isOpen={showFromDropdown}
//               onToggle={() => setShowFromDropdown(!showFromDropdown)}
//               onSelect={setFromToken}
//               excludeToken={toToken}
//             />
            
//             <div className="flex-1">
//               <input
//                 type="number"
//                 value={fromAmount}
//                 onChange={(e) => setFromAmount(e.target.value)}
//                 placeholder="0.0"
//                 className="w-full text-2xl font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
//               />
//               {fromToken && fromAmount && (
//                 <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
//                   ≈ ${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Swap Button */}
//         <div className="flex justify-center">
//           <button
//             onClick={handleSwapTokens}
//             className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all duration-200 hover:scale-105"
//           >
//             <ArrowUpDown size={20} className="text-slate-600 dark:text-slate-400" />
//           </button>
//         </div>

//         {/* To Token */}
//         <div className="space-y-3">
//           <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
//             To
//           </label>
          
//           <div className="flex items-center gap-4">
//             <TokenSelector
//               token={toToken}
//               isOpen={showToDropdown}
//               onToggle={() => setShowToDropdown(!showToDropdown)}
//               onSelect={setToToken}
//               excludeToken={fromToken}
//             />
            
//             <div className="flex-1">
//               <input
//                 type="number"
//                 value={toAmount}
//                 readOnly
//                 placeholder="0.0"
//                 className="w-full text-2xl font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
//               />
//               {toToken && toAmount && (
//                 <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
//                   ≈ ${(parseFloat(toAmount) * toToken.price).toFixed(2)}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Swap Details */}
//         {fromToken && toToken && fromAmount && (
//           <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-slate-600 dark:text-slate-400">Exchange Rate</span>
//               <span className="font-medium text-slate-900 dark:text-white">
//                 1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
//               </span>
//             </div>
            
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-slate-600 dark:text-slate-400">Price Impact</span>
//               <span className={`font-medium ${priceImpact > 1 ? 'text-red-500' : 'text-green-500'}`}>
//                 {priceImpact.toFixed(2)}%
//               </span>
//             </div>
            
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-slate-600 dark:text-slate-400">Slippage Tolerance</span>
//               <div className="flex items-center gap-2">
//                 <select
//                   value={slippage}
//                   onChange={(e) => setSlippage(parseFloat(e.target.value))}
//                   className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none"
//                 >
//                   <option value={0.1}>0.1%</option>
//                   <option value={0.5}>0.5%</option>
//                   <option value={1.0}>1.0%</option>
//                   <option value={3.0}>3.0%</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Swap Button */}
//         <button
//           onClick={handleSwap}
//           disabled={!fromToken || !toToken || !fromAmount || isSwapping || parseFloat(fromAmount) > (fromToken?.balance || 0)}
//           className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
//             !fromToken || !toToken || !fromAmount || isSwapping || parseFloat(fromAmount) > (fromToken?.balance || 0)
//               ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
//               : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
//           }`}
//         >
//           {isSwapping ? (
//             <>
//               <Loader2 size={20} className="animate-spin" />
//               Swapping...
//             </>
//           ) : (
//             <>
//               <Zap size={20} />
//               Swap Tokens
//             </>
//           )}
//         </button>
//       </div>

//       {/* Features */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-4 text-center">
//           <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
//             <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//           </div>
//           <h3 className="font-bold text-slate-900 dark:text-white mb-1">Instant Swaps</h3>
//           <p className="text-xs text-slate-500 dark:text-slate-400">
//             Lightning-fast token exchanges
//           </p>
//         </div>

//         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-4 text-center">
//           <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
//             <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
//           </div>
//           <h3 className="font-bold text-slate-900 dark:text-white mb-1">Best Rates</h3>
//           <p className="text-xs text-slate-500 dark:text-slate-400">
//             Optimized pricing algorithms
//           </p>
//         </div>

//         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-4 text-center">
//           <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
//             <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//           </div>
//           <h3 className="font-bold text-slate-900 dark:text-white mb-1">Secure</h3>
//           <p className="text-xs text-slate-500 dark:text-slate-400">
//             Audited smart contracts
//           </p>
//         </div>
//       </div>

//       {/* Info Banner */}
//       <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20 p-4">
//         <div className="flex items-start gap-3">
//           <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
//           <div>
//             <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
//               Smart Swap Technology
//             </h4>
//             <p className="text-sm text-blue-700 dark:text-blue-200">
//               Our advanced routing algorithm finds the best exchange rates across multiple liquidity pools 
//               to ensure you get maximum value for your swaps.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SwapScreen;