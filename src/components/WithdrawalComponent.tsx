import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  History, 
  Banknote, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCircle2, 
  Clock,
  ShieldAlert,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTonPrice } from '@/hooks/useTonPrice';
import { useTonAddress } from '@tonconnect/ui-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface Activity {
  id: string;
  type: 'claim' | 'withdraw_ton' | 'withdraw_smart' | 'convert_smart' | 'stake' | 'deposit' | 'smart_claim' | 'withdrawal_request';
  amount: number;
  token: 'TON' | 'SMART' | 'SBT';
  timestamp: number;
  txHash: string;
  recipient?: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
}

interface WithdrawalComponentProps {
  showSnackbar: (config: { message: string; description?: string }) => void;
}

const WithdrawalComponent: React.FC<WithdrawalComponentProps> = ({ showSnackbar }) => {
  const { user } = useAuth();
  const { tonPrice } = useTonPrice();
  const connectedAddress = useTonAddress();
  
  // State
  // const [smartMode] = useState<'convert' | 'withdraw'>('convert');
  // const [smartInput, setSmartInput] = useState('');
  const [tonInput, setTonInput] = useState('');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalances, setUserBalances] = useState({
    claimedAmount: 0, // Available earnings to withdraw
    stakedAmount: 0,  // Total staked TON
    tonBalance: 0,    // Available TON balance
    sbtBalance: 0     // SBT token balance
  });

  // Load user balances and activities
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        // Load user balances with proper error handling
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('balance, stake, available_earnings, total_earned, total_sbt')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.error('Error loading user data:', userError);
          return;
        }

        if (userData) {
          setUserBalances({
            claimedAmount: Number(userData.available_earnings) || 0,
            stakedAmount: Number(userData.stake) || 0,
            tonBalance: Number(userData.balance) || 0,
            sbtBalance: Number(userData.total_sbt) || 0
          });
        }

        // Load activities with proper filtering
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .in('type', ['claim', 'withdraw_ton', 'withdraw_smart', 'convert_smart', 'stake', 'deposit', 'smart_claim', 'withdrawal_request'])
          .order('created_at', { ascending: false })
          .limit(20);

        if (activitiesError) {
          console.error('Error loading activities:', activitiesError);
          return;
        }

        if (activitiesData) {
          const formattedActivities: Activity[] = activitiesData.map(activity => ({
            id: activity.id,
            type: activity.type,
            amount: Number(activity.amount),
            token: activity.type === 'smart_claim' || activity.type === 'convert_smart' || activity.type === 'withdraw_smart' ? 'SBT' : 'TON',
            timestamp: new Date(activity.created_at).getTime(),
            txHash: activity.metadata?.tx_hash || activity.metadata?.withdrawal_request_id || `tx_${activity.id}`,
            recipient: activity.metadata?.recipient || activity.metadata?.wallet_address || connectedAddress,
            status: activity.status || 'completed',
            metadata: activity.metadata
          }));
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();

    // Set up real-time subscription for user balance changes
    const userSubscription = supabase
      .channel(`user_balance_${user?.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user?.id}`
      }, (payload) => {
        if (payload.new) {
          const newData = payload.new as any;
          setUserBalances(prev => ({
            ...prev,
            claimedAmount: Number(newData.available_earnings) || 0,
            stakedAmount: Number(newData.stake) || 0,
            tonBalance: Number(newData.balance) || 0,
            sbtBalance: Number(newData.total_sbt) || 0
          }));
        }
      })
      .subscribe();

    // Set up real-time subscription for new activities
    const activitiesSubscription = supabase
      .channel(`user_activities_${user?.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        if (payload.new) {
          const newActivity = payload.new as any;
          const formattedActivity: Activity = {
            id: newActivity.id,
            type: newActivity.type,
            amount: Number(newActivity.amount),
            token: newActivity.type === 'smart_claim' || newActivity.type === 'convert_smart' || newActivity.type === 'withdraw_smart' ? 'SBT' : 'TON',
            timestamp: new Date(newActivity.created_at).getTime(),
            txHash: newActivity.metadata?.tx_hash || newActivity.metadata?.withdrawal_request_id || `tx_${newActivity.id}`,
            recipient: newActivity.metadata?.recipient || newActivity.metadata?.wallet_address || connectedAddress,
            status: newActivity.status || 'completed',
            metadata: newActivity.metadata
          };
          
          setActivities(prev => [formattedActivity, ...prev.slice(0, 19)]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(activitiesSubscription);
    };
  }, [user?.id, connectedAddress]);

  // Helper functions
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getFullTime = (ts: number) => {
    return new Date(ts).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Copied to clipboard!", { icon: '📋' });
  };

  const toggleExpand = (id: string) => {
    setExpandedTx(expandedTx === id ? null : id);
  };

  // Calculations
  const smartUsd = userBalances.sbtBalance * (tonPrice * 0.001); // SBT is 10% of TON price
  const tonLiquidUsd = userBalances.tonBalance * tonPrice;
  const tonLockedUsd = userBalances.stakedAmount * tonPrice;
  const claimedUsd = userBalances.claimedAmount * tonPrice;
  // const totalUsd = smartUsd + tonLiquidUsd + tonLockedUsd + claimedUsd;
  
  // Smart token calculations
  // const estimatedTonFromSmart = parseFloat(smartInput || '0') * 0.1; // 1 SBT = 0.1 TON conversion rate


  // Handlers
  // const handleSmartAction = async () => {
  //   const val = parseFloat(smartInput);
    
  //   if (isNaN(val) || val <= 0) {
  //     showSnackbar({
  //       message: 'Invalid Amount',
  //       description: 'Please enter a valid amount greater than 0'
  //     });
  //     return;
  //   }

  //   if (val > userBalances.sbtBalance) {
  //     showSnackbar({
  //       message: 'Insufficient Balance',
  //       description: `You only have ${userBalances.sbtBalance.toFixed(0)} SBT available`
  //     });
  //     return;
  //   }

  //   if (!connectedAddress && smartMode === 'withdraw') {
  //     showSnackbar({
  //       message: 'Wallet Not Connected',
  //       description: 'Please connect your wallet first'
  //     });
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     if (smartMode === 'convert') {
  //       // Convert SBT to TON
  //       const { data, error } = await supabase.rpc('convert_sbt_to_ton', {
  //         p_user_id: user?.id,
  //         p_sbt_amount: val
  //       });

  //       if (error) throw error;

  //       if (data?.success) {
  //         showSnackbar({
  //           message: 'Conversion Successful! 🔄',
  //           description: `${val} SBT converted to ${estimatedTonFromSmart.toFixed(4)} TON`
  //         });
  //         setSmartInput('');
  //       } else {
  //         throw new Error(data?.error || 'Conversion failed');
  //       }
  //     } else {
  //       // Withdraw SBT
  //       const { error } = await supabase.from('withdrawal_requests').insert({
  //         user_id: user?.id,
  //         amount: val,
  //         token_type: 'SBT',
  //         wallet_address: connectedAddress,
  //         status: 'pending',
  //         created_at: new Date().toISOString()
  //       });

  //       if (error) throw error;

  //       // Update SBT balance
  //       const { error: updateError } = await supabase
  //         .from('users')
  //         .update({ 
  //           total_sbt: userBalances.sbtBalance - val 
  //         })
  //         .eq('id', user?.id);

  //       if (updateError) throw updateError;

  //       // Record activity
  //       await supabase.from('activities').insert({
  //         user_id: user?.id,
  //         type: 'withdraw_smart',
  //         amount: val,
  //         status: 'pending',
  //         created_at: new Date().toISOString(),
  //         metadata: {
  //           wallet_address: connectedAddress,
  //           token_type: 'SBT'
  //         }
  //       });

  //       showSnackbar({
  //         message: 'Withdrawal Requested! 💰',
  //         description: `${val} SBT withdrawal request submitted successfully`
  //       });

  //       setSmartInput('');
  //     }
  //   } catch (error) {
  //     console.error('Smart action failed:', error);
  //     showSnackbar({
  //       message: 'Action Failed',
  //       description: error instanceof Error ? error.message : 'Please try again later'
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleTonWithdraw = async () => {
    const val = parseFloat(tonInput);
    
    // Basic validation - minimum 1 TON
    if (isNaN(val) || val <= 0) {
      showSnackbar({
        message: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0'
      });
      return;
    }

    // Check minimum withdrawal amount
    if (val < 1) {
      showSnackbar({
        message: 'Minimum Withdrawal Required',
        description: 'Minimum withdrawal amount is 1 TON'
      });
      return;
    }

    // Check if user has sufficient balance
    if (val > userBalances.claimedAmount) {
      showSnackbar({
        message: 'Insufficient Balance',
        description: `You only have ${userBalances.claimedAmount.toFixed(4)} TON available`
      });
      return;
    }

    if (!connectedAddress) {
      showSnackbar({
        message: 'Wallet Not Connected',
        description: 'Please connect your wallet first'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create a withdrawal request record in a custom table (using activities for now)
      const withdrawalRequestId = `wr_${Date.now()}_${user?.id}`;
      
      // First, create the withdrawal request record
      const { error: requestError } = await supabase.from('activities').insert({
        user_id: user?.id,
        type: 'withdrawal_request',
        amount: val,
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          wallet_address: connectedAddress,
          token_type: 'TON',
          withdrawal_request_id: withdrawalRequestId,
          request_type: 'withdrawal_request',
          processing_status: 'awaiting_admin'
        }
      });

      if (requestError) {
        console.error('Withdrawal request creation error:', requestError);
        throw new Error('Failed to create withdrawal request');
      }

      // Update available earnings (deduct the requested amount)
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          available_earnings: userBalances.claimedAmount - val 
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Balance update error:', updateError);
        throw updateError;
      }

      // Record the withdrawal activity for transaction history
      const { error: activityError } = await supabase.from('activities').insert({
        user_id: user?.id,
        type: 'withdraw_ton',
        amount: val,
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          wallet_address: connectedAddress,
          token_type: 'TON',
          withdrawal_request_id: withdrawalRequestId,
          withdrawal_method: 'admin_processed'
        }
      });

      if (activityError) {
        console.error('Activity record error:', activityError);
        // Don't throw here - the balance was already updated and request created
        console.warn('Withdrawal processed but activity record failed');
      }

      // Update local state to reflect the withdrawal
      setUserBalances(prev => ({
        ...prev,
        claimedAmount: prev.claimedAmount - val
      }));

      showSnackbar({
        message: 'Withdrawal Requested! 💰',
        description: `${val} TON withdrawal request submitted successfully. Request ID: ${withdrawalRequestId.slice(-8)}`
      });

      setTonInput('');
      
    } catch (error) {
      console.error('TON withdrawal failed:', error);
      
      // Handle specific error messages
      let errorMessage = 'Please try again later';
      if (error instanceof Error) {
        if (error.message.includes('Insufficient balance')) {
          errorMessage = error.message;
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = 'Database access issue. Please contact support.';
        } else if (error.message.includes('Failed to create withdrawal request')) {
          errorMessage = 'Could not create withdrawal request. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showSnackbar({
        message: 'Withdrawal Failed',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Assets Hub
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">
            Manage and withdraw your earnings
          </p>
        </div>
        {/* <div className="text-right">
          <span className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">
            Net Worth
          </span>
          <div className="text-slate-900 dark:text-white font-black text-lg sm:text-xl tabular-nums leading-none">
            ${totalUsd.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        </div> */}
      </div>

      {/* SBT Management Card */}
      <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-[32px] text-white space-y-6 shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Smart Airdrop Tokens
            </h3>
            <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-lg text-[8px] font-black uppercase">
              Smart Pool
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">
              {userBalances.sbtBalance.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </span>
            <span className="text-purple-500 font-bold text-sm">SMART</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500">
            ≈ ${smartUsd.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} USD
          </div>
        </div>

        {/* <div className="relative z-10 flex p-1 bg-white/5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setSmartMode('convert')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              smartMode === 'convert' 
                ? 'bg-white text-slate-900 shadow-lg' 
                : 'text-slate-500'
            }`}
          >
            <RefreshCw size={12} className={smartMode === 'convert' ? 'animate-spin-slow' : ''} />
            To TON
          </button>
          <button 
            onClick={() => setSmartMode('withdraw')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              smartMode === 'withdraw' 
                ? 'bg-white text-slate-900 shadow-lg' 
                : 'text-slate-500'
            }`}
          >
            <Send size={12} />
            Withdraw
          </button>
        </div> */}

        {/* <div className="relative z-10 space-y-4">
          <div className="bg-white/5 rounded-[24px] p-4 border border-white/10 space-y-3">
            <input 
              type="number" 
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder="0 SBT" 
              className="w-full bg-transparent text-2xl font-black outline-none placeholder:text-white/10"
            />
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {smartMode === 'convert' 
                  ? `Est. Receive: ${estimatedTonFromSmart.toFixed(4)} TON` 
                  : 'Send to Primary Wallet'
                }
              </span>
              <button 
                onClick={() => setSmartInput(userBalances.sbtBalance.toString())} 
                className="text-[9px] font-black text-purple-500 uppercase tracking-widest"
              >
                MAX
              </button>
            </div>
          </div>

          {smartMode === 'withdraw' && (
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-400" size={14} />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Destination Address
                </span>
              </div>
              <div className="text-[9px] font-black text-white bg-slate-800 px-2 py-1 rounded-lg border border-white/5">
                {connectedAddress ? 
                  `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 
                  'Not connected'
                }
              </div>
            </div>
          )}

          <button 
            onClick={handleSmartAction}
            disabled={!smartInput || parseFloat(smartInput) <= 0 || parseFloat(smartInput) > userBalances.sbtBalance || isLoading}
            className="w-full py-4 bg-white text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                {smartMode === 'convert' ? 'Convert to TON' : 'Request Withdrawal'}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div> */}
      </div> 

      {/* Available Earnings Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
              <Banknote size={20} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Available Earnings
              </h3>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {userBalances.claimedAmount.toFixed(4)} <span className="text-xs font-bold opacity-40">TON</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
              Ready to Withdraw
            </div>
            <div className="text-[9px] font-black text-green-500">
              ≈ ${claimedUsd.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/10 px-4 py-3 flex items-center">
              <input 
                type="number"
                value={tonInput}
                onChange={(e) => setTonInput(e.target.value)}
                placeholder="Withdrawal amount..."
                className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none w-full"
                min="0"
                step="0.000001"
              />
              <button 
                onClick={() => setTonInput(userBalances.claimedAmount.toString())} 
                className="text-[9px] font-black text-green-500 uppercase ml-2 hover:text-green-600 transition-colors"
              >
                MAX
              </button>
            </div>
            
            {/* Validation Messages */}
            {tonInput && parseFloat(tonInput) > 0 && parseFloat(tonInput) < 1 && (
              <div className="flex items-center gap-2 text-orange-500 text-xs px-2">
                <AlertTriangle size={12} />
                <span>Minimum withdrawal amount is 1 TON</span>
              </div>
            )}
            
            {tonInput && parseFloat(tonInput) > userBalances.claimedAmount && (
              <div className="flex items-center gap-2 text-red-500 text-xs px-2">
                <AlertTriangle size={12} />
                <span>Amount exceeds available balance ({userBalances.claimedAmount.toFixed(4)} TON)</span>
              </div>
            )}
            
            {tonInput && parseFloat(tonInput) >= 1 && parseFloat(tonInput) <= userBalances.claimedAmount && (
              <div className="flex items-center gap-2 text-green-500 text-xs px-2">
                <CheckCircle2 size={12} />
                <span>Ready to withdraw {parseFloat(tonInput).toFixed(4)} TON</span>
              </div>
            )}
            
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Wallet size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Main Wallet:
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-900 dark:text-slate-200">
                {connectedAddress ? 
                  `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 
                  'Not connected'
                }
              </span>
            </div>
            
            <button 
              onClick={handleTonWithdraw}
              disabled={!tonInput || parseFloat(tonInput) < 1 || parseFloat(tonInput) > userBalances.claimedAmount || isLoading || !connectedAddress}
              className="w-full py-4 bg-slate-900 dark:bg-green-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : !connectedAddress ? (
                <>
                  Connect Wallet First
                  <Wallet size={14} />
                </>
              ) : parseFloat(tonInput || '0') < 1 && tonInput ? (
                <>
                  Minimum 1 TON Required
                  <AlertTriangle size={14} />
                </>
              ) : (
                <>
                  Withdraw TON
                  <Send size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Withdrawal Info */}
        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-3 border border-blue-100 dark:border-blue-500/20">
          <h4 className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <ShieldCheck size={12} />
            Withdrawal Information
          </h4>
          <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            <div>• Minimum withdrawal amount: 1 TON</div>
            <div>• Balance deducted immediately upon request</div>
            <div>• Processing handled by admin team (24-48h)</div>
            <div>• Withdrawals sent to your connected wallet</div>
            <div>• Track status in transaction history below</div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            Staked TON
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {userBalances.stakedAmount.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ${tonLockedUsd.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            TON Balance
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {userBalances.tonBalance.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ${tonLiquidUsd.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] sm:text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
            Transaction History
          </h3>
          <button className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
            Protocol <ShieldAlert size={10} />
          </button>
        </div>

        <div className="space-y-3 min-h-[100px]">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className={`bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm transition-all overflow-hidden ${
                  expandedTx === activity.id ? 'ring-1 ring-slate-200 dark:ring-white/10' : ''
                }`}
              >
                <div 
                  onClick={() => toggleExpand(activity.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                      activity.type === 'convert_smart' 
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' 
                        : activity.type === 'smart_claim' || activity.type === 'claim'
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-500' 
                        : activity.type === 'withdraw_ton' || activity.type === 'withdraw_smart' || activity.type === 'withdrawal_request'
                        ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                        : activity.type === 'stake'
                        ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-500'
                        : activity.type === 'deposit'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {activity.type === 'convert_smart' ? <RefreshCw size={16} /> :
                       activity.type === 'withdraw_ton' || activity.type === 'withdrawal_request' ? <Banknote size={16} /> :
                       activity.type === 'withdraw_smart' ? <Send size={16} /> :
                       activity.type === 'smart_claim' || activity.type === 'claim' ? <Star size={16} /> :
                       activity.type === 'stake' ? <TrendingUp size={16} /> :
                       activity.type === 'deposit' ? <Wallet size={16} /> :
                       <History size={16} />}
                    </div>
                    <div>
                      <div className="text-slate-800 dark:text-slate-200 text-[11px] font-black uppercase tracking-tight">
                        {activity.type === 'convert_smart' ? 'SBT Conversion' :
                         activity.type === 'withdraw_ton' ? 'TON Withdrawal' :
                         activity.type === 'withdrawal_request' ? 'Withdrawal Request' :
                         activity.type === 'withdraw_smart' ? 'SBT Withdrawal' :
                         activity.type === 'smart_claim' ? 'Task Reward' :
                         activity.type === 'claim' ? 'Staking Reward' :
                         activity.type === 'stake' ? 'Staking' :
                         activity.type === 'deposit' ? 'Deposit' :
                         'Transaction'}
                      </div>
                      <div className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-wider">
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-[12px] font-black tabular-nums ${
                        activity.type === 'smart_claim' || activity.type === 'claim' || activity.type === 'deposit' 
                          ? 'text-green-600' 
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {['stake', 'withdraw_ton', 'withdraw_smart', 'convert_smart', 'withdrawal_request'].includes(activity.type) ? '-' : '+'}
                        {activity.amount.toFixed(activity.token === 'TON' ? 4 : 0)} {activity.token}
                      </div>
                    </div>
                    {expandedTx === activity.id ? 
                      <ChevronUp size={14} className="text-slate-300" /> : 
                      <ChevronDown size={14} className="text-slate-300" />
                    }
                  </div>
                </div>

                {expandedTx === activity.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Status
                        </span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          activity.status === 'completed' 
                            ? 'bg-green-500/10 text-green-500'
                            : activity.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {activity.status === 'completed' ? <CheckCircle2 size={10} /> :
                           activity.status === 'pending' ? <Clock size={10} /> :
                           <AlertTriangle size={10} />}
                          {activity.status}
                        </div>
                      </div>

                      {activity.recipient && (
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Recipient
                          </span>
                          <button 
                            onClick={() => copyHash(activity.recipient!)}
                            className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-white/10"
                          >
                            {activity.recipient.slice(0, 8)}... <Copy size={10} />
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Transaction ID
                        </span>
                        <button 
                          onClick={() => copyHash(activity.txHash)}
                          className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-white/10"
                        >
                          {activity.txHash.slice(0, 8)}... <Copy size={10} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Time
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          <Clock size={10} className="text-slate-300" /> 
                          {getFullTime(activity.timestamp)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Value at Transaction
                        </span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">
                          ${(activity.amount * (activity.token === 'SBT' ? tonPrice * 0.1 : tonPrice)).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-20">
              <History size={48} className="text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                No transactions recorded
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalComponent;