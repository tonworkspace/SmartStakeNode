import { FC, useState, useRef, useEffect } from 'react';
import { FaHome, FaCog, FaUserFriends, FaTasks, FaBalanceScale } from 'react-icons/fa';
import { User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useTonPrice } from '@/hooks/useTonPrice';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { toNano, beginCell } from '@ton/core';
import { Button } from '@telegram-apps/telegram-ui';
import { Snackbar } from '@telegram-apps/telegram-ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { SponsorGate } from '@/components/SponsorGate';
import { EnhancedMiningScreen } from '@/components/EnhancedMiningScreen';
import { StakeModal } from '@/components/StakeModal';
import WithdrawalComponent from '@/components/WithdrawalComponent';
import SettingsComponent from '@/components/SettingsComponent';
import ReferralSystem from '@/components/ReferralSystem';
import SocialTasks from '@/components/SocialTasks';
import { OfflineIndicator, OfflineBanner } from '@/components/OfflineIndicator';
import { supabase } from '@/lib/supabaseClient';
import { processDeposit, createStake } from '@/lib/supabaseClient';
import { DEPOSIT_CONFIG, generateUniqueDepositId, isValidTonAddress } from '@/config/depositConfig';


// Snackbar configuration interface
interface SnackbarConfig {
  message: string;
  description?: string;
  duration?: number;
}

// Constants
const SNACKBAR_DURATION = 5000; // 5 seconds

export const IndexPage: FC = () => {
  // Auth hook - keeps user authentication and profile
  const { user, isLoading, error, updateUserData } = useAuth();
  
  // Theme hook for dark mode
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Get real TON price
  const { tonPrice } = useTonPrice();
  
  // TON Connect hooks
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();
  
  // Auth state - track if user has completed onboarding
  const [hasCompletedAuth, setHasCompletedAuth] = useState(false);
  
  // Sponsor gate state
  const [showSponsorGate, setShowSponsorGate] = useState(false);
  
  // Navigation state
  const [currentTab, setCurrentTab] = useState('home');
  
  // Modal state
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  
  // Deposit state
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  
  // Refresh trigger for MiningScreen
  const [miningRefreshTrigger, setMiningRefreshTrigger] = useState(0);
  
  // Snackbar state
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDescription, setSnackbarDescription] = useState('');
  const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if user needs to see auth screen
  useEffect(() => {
    const authCompleted = localStorage.getItem('smartstake_auth_completed');
    if (authCompleted === 'true') {
      setHasCompletedAuth(true);
    }
  }, []);

  // Check if user needs sponsor gate
  useEffect(() => {
    const checkSponsorRequirement = async () => {
      if (user && hasCompletedAuth) {
        try {
          // Check if user is the first user (admin)
          const { data: isFirstUser, error: firstUserError } = await supabase.rpc('is_first_user', {
            p_user_id: user.id
          });

          if (firstUserError) {
            console.error('Error checking first user:', firstUserError);
          }

          // If user is first user, bypass sponsor gate
          if (isFirstUser) {
            setShowSponsorGate(false);
            return;
          }

          // If user already has sponsor_id, bypass sponsor gate
          if (user.sponsor_id) {
            setShowSponsorGate(false);
            return;
          }

          // Check if user has any referral record (as referred user)
          const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id, sponsor_id')
            .eq('referred_id', user.id)
            .single();

          if (existingReferral) {
            // User has referral record but no sponsor_id in users table
            // Update the users table with the sponsor_id from referrals
            await updateUserData({ sponsor_id: existingReferral.sponsor_id });
            setShowSponsorGate(false);
          } else {
            // User needs a sponsor
            setShowSponsorGate(true);
          }
        } catch (error) {
          console.error('Error checking sponsor requirement:', error);
          // On error, show sponsor gate as fallback (unless user already has sponsor)
          setShowSponsorGate(!user.sponsor_id);
        }
      }
    };

    checkSponsorRequirement();
  }, [user, hasCompletedAuth, updateUserData]);

  // Handle auth completion
  const handleAuthComplete = () => {
    localStorage.setItem('smartstake_auth_completed', 'true');
    setHasCompletedAuth(true);
  };

  // Handle sponsor gate unlock
  const handleSponsorUnlock = async () => {
    setShowSponsorGate(false);
    
    // Refresh user data to get the latest sponsor information
    if (user?.id) {
      await updateUserData({ id: user.id });
    }
    
    // Show success message
    showSnackbar({
      message: 'Sponsor Verified! ✅',
      description: 'Your upline has been successfully registered'
    });
  };

  // Real market data using live TON price
  const marketData = {
    smartPrice: tonPrice // Real TON price from API
  };

  // Utility function to show snackbar notifications
  const showSnackbar = ({ message, description = '', duration = SNACKBAR_DURATION }: SnackbarConfig) => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }

    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setSnackbarVisible(true);

    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, duration);
  };

  // Staking handlers - these will be called by MiningScreen after database operations
  const handleClaim = async (amount: number) => {
    // Refresh user data to reflect the new available earnings
    if (user?.id) {
      await updateUserData({ id: user.id });
    }
    
    showSnackbar({
      message: 'Rewards Claimed! ✨',
      description: `Successfully claimed ${amount.toFixed(6)} TON in staking rewards!`
    });
  };

  // Handler to open stake modal
  const handleOpenStakeModal = () => {
    setIsStakeModalOpen(true);
  };

  // Handler for reward claims from SocialTasks
  const handleRewardClaimed = async (amount: number) => {
    showSnackbar({
      message: 'Task Reward Claimed! 🎉',
      description: `Successfully earned ${amount} Smart (SBT) tokens!`
    });
  };

  // Calculate Daily ROI based on amount
  const calculateDailyROI = (stakeAmount: number): number => {
    let baseDailyROI = 0.01; // 1% base daily ROI
    
    // Tier bonuses based on stake amount
    if (stakeAmount >= 1000) baseDailyROI = 0.03; // 3% daily for 1000+ TON
    else if (stakeAmount >= 500) baseDailyROI = 0.025; // 2.5% daily for 500+ TON
    else if (stakeAmount >= 100) baseDailyROI = 0.02; // 2% daily for 100+ TON
    else if (stakeAmount >= 50) baseDailyROI = 0.015; // 1.5% daily for 50+ TON
    
    return baseDailyROI;
  };

  // Centralized balance update function
  const updateUserBalance = async (userId: number, amount: number) => {
    try {
      // Try using the increment_sbt RPC function first for SBT tokens
      const { error: sbtError } = await supabase.rpc('increment_sbt', {
        user_id: userId,
        amount: amount
      });

      if (sbtError) {
        console.error('Failed to update user SBT via RPC:', sbtError);
        // Fallback: try direct update to total_sbt
        const { data: currentUser } = await supabase
          .from('users')
          .select('total_sbt')
          .eq('id', userId)
          .single();
        
        if (currentUser) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ total_sbt: (Number(currentUser.total_sbt) || 0) + amount })
            .eq('id', userId);
          
          if (updateError) {
            throw new Error(`Failed to update total_sbt: ${updateError.message}`);
          }
        } else {
          throw new Error('User not found for SBT update');
        }
      }
      
      // Refresh user data after balance update
      if (user?.id === userId) {
        await updateUserData({ id: userId });
      }
      
      return true;
    } catch (error) {
      console.error('SBT balance update failed:', error);
      return false;
    }
  };

  // Centralized deposit handler
  const handleDeposit = async (amount: number) => {
    try {
      // Validate amount
      if (amount < 1) {
        showSnackbar({ 
          message: 'Invalid Amount', 
          description: 'Minimum deposit amount is 1 TON' 
        });
        return;
      }

      // Validate user and wallet connection
      if (!user?.id || !userFriendlyAddress) {
        showSnackbar({ 
          message: 'Wallet Not Connected', 
          description: 'Please connect your wallet first' 
        });
        return;
      }

      // Validate minimum amount
      if (amount < DEPOSIT_CONFIG.MIN_AMOUNT) {
        showSnackbar({
          message: 'Amount Too Low',
          description: `Minimum deposit amount is ${DEPOSIT_CONFIG.MIN_AMOUNT} TON`
        });
        return;
      }

      // Validate deposit address
      if (!isValidTonAddress(DEPOSIT_CONFIG.ADDRESS)) {
        showSnackbar({
          message: 'Configuration Error',
          description: 'Invalid deposit address configuration'
        });
        return;
      }

      setDepositStatus('pending');
      const amountInNano = toNano(amount.toString());

      // Generate unique ID
      const depositId = generateUniqueDepositId();

      // Record pending deposit
      const { error: pendingError } = await supabase
        .from('deposits')
        .insert([{
          id: depositId,
          user_id: user.id,
          amount: amount,
          amount_nano: amountInNano.toString(),
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (pendingError) throw pendingError;

      // Create a proper payload cell for the transaction
      const payloadText = `deposit_${user.id}_${depositId}_${Date.now()}`;
      const payloadCell = beginCell()
        .storeUint(0, 32) // op code for text comment
        .storeStringTail(payloadText)
        .endCell();

      // Create transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + DEPOSIT_CONFIG.TRANSACTION_TIMEOUT,
        messages: [{
          address: DEPOSIT_CONFIG.ADDRESS,
          amount: amountInNano.toString(),
          payload: payloadCell.toBoc().toString('base64')
        }],
      };

      const result = await tonConnectUI.sendTransaction(transaction);

      if (result) {
        // Update deposit status
        const { error: updateError } = await supabase
          .from('deposits')
          .update({ 
            status: 'confirmed',
            tx_hash: result.boc
          })
          .eq('id', depositId);

        if (updateError) throw updateError;

        // Process deposit
        const success = await processDeposit(
          user.id, 
          amount, 
          result.boc || `tx_${depositId}_${Date.now()}`
        );

        if (success) {
          // Auto-stake functionality
          const now = new Date();
          const stakeData = {
            user_id: user.id,
            amount: amount,
            daily_rate: calculateDailyROI(amount),
            is_active: true,
            cycle_progress: 0,
            total_earned: 0,
            created_at: now.toISOString(),
            // Set last_payout to 24 hours ago so user can claim immediately
            last_payout: new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString()
          };
          
          const newStake = await createStake(stakeData);
          
          if (newStake) {
            // Update user stake amount
            await updateUserData({
              stake: (user.stake || 0) + amount,
              stake_date: new Date().toISOString()
            });

            // Update UI state
            setDepositStatus('success');
            showSnackbar({ 
              message: 'Deposit Successful', 
              description: `Successfully deposited ${amount} TON and started staking. You can claim rewards immediately!` 
            });

            // Refresh user data
            await updateUserData({ id: user.id });
            
            // Trigger MiningScreen refresh
            setMiningRefreshTrigger(prev => prev + 1);
            
            setIsStakeModalOpen(false);
          } else {
            throw new Error('Failed to create stake');
          }
        }
      }
    } catch (error: any) {
      console.error('Deposit failed:', error);
      setDepositStatus('error');
      
      // Enhanced error handling
      if (error?.message?.includes('user rejected')) {
        showSnackbar({ 
          message: 'Transaction Cancelled', 
          description: 'Transaction was rejected by user' 
        });
      } else if (error?.message?.includes('insufficient funds')) {
        showSnackbar({ 
          message: 'Insufficient Funds', 
          description: 'Not enough TON in your wallet' 
        });
      } else {
        showSnackbar({ 
          message: 'Deposit Failed', 
          description: 'Please try again later' 
        });
      }
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Show AuthScreen for new users or if auth not completed
  if (!hasCompletedAuth) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        {/* Header with theme toggle */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="max-w-xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">Smart Stake AI</span>
                <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest opacity-80">
                  Welcome
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Auth Screen Content */}
        <div className="flex-1 pt-16">
          <AuthScreen onConnect={handleAuthComplete} />
        </div>
      </div>
    );
  }

  // Show SponsorGate if user needs a sponsor
  if (showSponsorGate && user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        {/* Header with theme toggle */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="max-w-xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">Smart Stake AI</span>
                <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest opacity-80">
                  Activation Required
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Sponsor Gate Content */}
        <div className="flex-1 pt-16">
          <SponsorGate onUnlock={handleSponsorUnlock} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased mb-[5rem]">
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* New Header Design */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                {user?.photoUrl ? (
                  <img 
                    src={user.photoUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight">
                  @{user?.username || 'username'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest opacity-80">
                Online • Node #{user?.id || '0000'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator className="hidden sm:flex" />
            <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-16">
        {currentTab === 'home' && (
          <div className="p-4">
            <EnhancedMiningScreen
              onStake={handleOpenStakeModal}
              onClaim={handleClaim}
              marketData={marketData}
              refreshTrigger={miningRefreshTrigger}
              showSnackbar={showSnackbar}
            />
          </div>
        )}

        {currentTab === 'task' && (
            <div className="p-4">
         <SocialTasks 
        showSnackbar={showSnackbar}
        userId={user?.id}
        onRewardClaimed={handleRewardClaimed}
        updateUserBalance={updateUserBalance}
        />
        </div>
        )}

        {currentTab === 'activity' && (
          <div className="p-4">
            <WithdrawalComponent showSnackbar={showSnackbar} />
          </div>
        )}

        {currentTab === 'network' && (
         <ReferralSystem/>
        )}

        {currentTab === 'settings' && (
          <div className="p-4">
           <SettingsComponent 
             theme={isDarkMode ? 'dark' : 'light'} 
             setTheme={(theme) => {
               // Convert theme string to boolean and call toggleTheme if needed
               const shouldBeDark = theme === 'dark';
               if (shouldBeDark !== isDarkMode) {
                 toggleTheme();
               }
             }}
             onResetAuth={() => {
               localStorage.removeItem('smartstake_auth_completed');
               setHasCompletedAuth(false);
               showSnackbar({
                 message: 'Auth Reset',
                 description: 'You will see the welcome screen on next visit'
               });
             }}
             onResetSponsor={() => {
               setShowSponsorGate(true);
               showSnackbar({
                 message: 'Sponsor Gate Reset',
                 description: 'Sponsor activation screen will be shown'
               });
             }}
           />
          </div>
        )}
      </div>

      {/* New Bottom Navigation Design */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
        <div className="max-w-2xl mx-auto px-2 h-20 flex items-center justify-between">
          {[
            { 
              id: 'home', 
              text: 'Home', 
              icon: FaHome,
              gradient: 'from-blue-500 to-cyan-500'
            },
            { 
              id: 'activity', 
              text: 'Activity', 
              icon: FaBalanceScale,
              gradient: 'from-purple-500 to-pink-500'
            },
            { 
              id: 'task', 
              text: 'Task', 
              icon: FaTasks,
              gradient: 'from-indigo-500 to-purple-500'
            },
           
            { 
              id: 'network', 
              text: 'Network', 
              icon: FaUserFriends,
              gradient: 'from-green-500 to-emerald-500'
            },
            { 
              id: 'settings', 
              text: 'Settings', 
              icon: FaCog,
              gradient: 'from-orange-500 to-red-500'
            },
          ].map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (navigator.vibrate) navigator.vibrate(5);
                }}
                className={`relative flex flex-col items-center justify-center flex-1 transition-all duration-300 ${
                  isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`relative p-2.5 rounded-2xl transition-all duration-500 mb-1 ${
                  isActive 
                    ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg shadow-blue-500/20` 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  <Icon size={isActive ? 22 : 20} />
                  {/* Live indicator for notifications - you can customize this logic */}
                  {item.id === 'notifications' && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                  )}
                </div>
                
                <span className={`text-[9px] font-black uppercase tracking-tight transition-all duration-300 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {item.text}
                </span>
                
                {isActive && (
                  <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* StakeModal */}
      <StakeModal 
        isOpen={isStakeModalOpen} 
        onClose={() => setIsStakeModalOpen(false)} 
        onDeposit={handleDeposit}
        isLoading={depositStatus === 'pending'}
      />

      {/* Snackbar Notifications */}
      {isSnackbarVisible && (
        <Snackbar
          onClose={() => {
            setSnackbarVisible(false);
            if (snackbarTimeoutRef.current) {
              clearTimeout(snackbarTimeoutRef.current);
            }
          }}
          duration={SNACKBAR_DURATION}
          description={snackbarDescription}
          after={
            <Button 
              size="s" 
              onClick={() => {
                setSnackbarVisible(false);
                if (snackbarTimeoutRef.current) {
                  clearTimeout(snackbarTimeoutRef.current);
                }
              }}
            >
              Close
            </Button>
          }
          className="snackbar-top"
        >
          {snackbarMessage}
        </Snackbar>
      )}
    </div>
  );
};