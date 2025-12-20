
import React, { useState, useEffect, useCallback, } from 'react';
import { MiningScreen } from '@/SmartComponents/MiningScreen';
import { MarketplaceScreen } from '@/SmartComponents/MarketplaceScreen';
import { WalletScreen } from '@/SmartComponents/WalletScreen';
import { InviteScreen } from '@/SmartComponents/InviteScreen';
import { SwapScreen } from '@/SmartComponents/SwapScreen';
import { LoadingScreen } from '@/SmartComponents/LoadingScreen';
import { OnboardingScreen } from '@/SmartComponents/OnboardingScreen';
import { Toaster, toast } from 'react-hot-toast';
import { Wallet, Home, ReceiptText, Store, TrendingUp, ArrowLeftRight, Users, Sun, Moon, LogOut } from 'lucide-react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';

export interface ActivityRecord {
  id: string;
  type: 'stake' | 'unstake' | 'claim' | 'purchase' | 'withdraw_smart' | 'convert_smart' | 'withdraw_ton';
  amount: number;
  token: 'TON' | 'SMART';
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  txHash: string;
  label?: string;
  recipient?: string;
}

export interface MarketData {
  smartPrice: number;
  tonPrice: number;
  smartChange: string;
}

const BASE_APY = 0.15; // 15% APY
const VAULT_KEY = 'smart_stake_vault_v13';

const App: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const { connectedAddressString } = useWallet();
  const [tonConnectUI] = useTonConnectUI();

  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'invite' | 'market' | 'swap'>('home');
  const [address, setAddress] = useState<string | null>(null);
  const [stakedBalance, setStakedBalance] = useState<number>(0);
  const [tonBalance, setTonBalance] = useState<number>(0); 
  const [claimedBalance, setClaimedBalance] = useState<number>(0);
  const [miningStartTime, setMiningStartTime] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [boostMultiplier, setBoostMultiplier] = useState<number>(1.0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // UI States
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Referral State
  const [referralCount, setReferralCount] = useState<number>(12);
  const [activeStakers, setActiveStakers] = useState<number>(8);
  
  const [marketData, setMarketData] = useState<MarketData>({
    smartPrice: 0.428,
    tonPrice: 5.24,
    smartChange: '+12.4%'
  });

  // Fetch TON Price with robust error handling
  const fetchTonPrice = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) return;
      const data = await response.json();
      if (data?.['the-open-network']?.usd) {
        setMarketData(prev => ({ ...prev, tonPrice: data['the-open-network'].usd }));
      }
    } catch (error) {
      console.debug("Price sync skipped: ", error instanceof Error ? error.message : 'Network connection');
    }
  }, []);

  // Save State Helper
  const persist = useCallback((
    staked: number, 
    ton: number, 
    start: number | null, 
    addr: string | null, 
    claimed: number, 
    history: ActivityRecord[], 
    boost: number,
    refs: number,
    actives: number,
    onboarded: boolean
  ) => {
    const payload = {
      staked,
      ton,
      start,
      addr,
      claimed,
      history,
      boost,
      refs,
      actives,
      onboarded,
      lastSaved: Date.now()
    };
    localStorage.setItem(VAULT_KEY, JSON.stringify(payload));
  }, []);

  // Load State & Offline Mining Logic
  useEffect(() => {
    // Initial App Sync Simulation
    setTimeout(() => {
      setIsLoadingApp(false);
    }, 2500);

    const saved = localStorage.getItem(VAULT_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setStakedBalance(d.staked || 0);
        setTonBalance(d.ton || 0);
        setMiningStartTime(d.start || null);
        setAddress(d.addr || null);
        setClaimedBalance(d.claimed || 0);
        setActivities(d.history || []);
        setBoostMultiplier(d.boost || 1.0);
        setReferralCount(d.refs ?? 12);
        setActiveStakers(d.actives ?? 8);
        setOnboardingComplete(d.onboarded || false);

        // Offline Mining Calculation
        if (d.start && d.staked > 0) {
          const now = Date.now();
          const elapsedSec = (now - d.start) / 1000;
          const ratePerSec = ((d.staked * BASE_APY) / (365 * 24 * 3600)) * (d.boost || 1.0);
          const earnedOffline = elapsedSec * ratePerSec;
          
          if (earnedOffline > 0.0001) {
            const newClaimed = (d.claimed || 0) + earnedOffline;
            setClaimedBalance(newClaimed);
            setMiningStartTime(now);
            persist(d.staked, d.ton, now, d.addr, newClaimed, d.history || [], d.boost || 1.0, d.refs ?? 12, d.actives ?? 8, d.onboarded || false);
            
            toast(`Network Resynced: Mined ${earnedOffline.toFixed(4)} SMART while offline`, {
              icon: '📡',
              duration: 5000,
              style: { border: '1px solid rgba(34,197,94,0.3)' }
            });
          }
        }
      } catch (e) {
        console.error("Vault recovery failed", e);
      }
    }

    const savedTheme = localStorage.getItem('smart_stake_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, [persist]);

  useEffect(() => {
    fetchTonPrice();
    const interval = setInterval(fetchTonPrice, 60000);
    return () => clearInterval(interval);
  }, [fetchTonPrice]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('smart_stake_theme', theme);
  }, [theme]);

  // Handle wallet connection
  useEffect(() => {
    if (connectedAddressString) {
      const walletAddress = connectedAddressString;
      const wasConnected = address !== null;

      setAddress(walletAddress);

      // Update user wallet address in database
      if (user && walletAddress !== user.wallet_address) {
        updateUserData({ wallet_address: walletAddress });
      }

      // Check if tutorial is needed
      if (!onboardingComplete) {
        setShowOnboarding(true);
      }

      persist(stakedBalance, tonBalance, miningStartTime, walletAddress, claimedBalance, activities, boostMultiplier, referralCount, activeStakers, onboardingComplete);

      // Only show toast on initial connection
      if (!wasConnected) {
        toast.success("Wallet Connected Successfully", { icon: '🛡️' });
      }
    } else {
      setAddress(null);
    }
  }, [connectedAddressString, user, updateUserData, onboardingComplete, stakedBalance, tonBalance, miningStartTime, claimedBalance, activities, boostMultiplier, referralCount, activeStakers, persist, address]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const handleLogout = async () => {
    try {
      await tonConnectUI.disconnect();
      toast.success("Wallet disconnected successfully", { icon: '🔌' });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error("Failed to disconnect wallet", { icon: '❌' });
    }
  };

  const generateTxHash = () => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
    return hash;
  };

  const addActivity = (type: ActivityRecord['type'], amount: number, token: ActivityRecord['token'], label?: string, recipient?: string) => {
    const newActivity: ActivityRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type, amount, token, timestamp: Date.now(), status: 'confirmed', txHash: generateTxHash(), label, recipient
    };
    const updatedHistory = [newActivity, ...activities].slice(0, 50);
    setActivities(updatedHistory);
    return updatedHistory;
  };


  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingComplete(true);
    persist(stakedBalance, tonBalance, miningStartTime, address, claimedBalance, activities, boostMultiplier, referralCount, activeStakers, true);
    toast.success("Mining Access Granted!", { icon: '🔓' });
  };

  const handleStake = async (amount: number) => {
    const tid = toast.loading("Finalizing Block Stake...");
    setTimeout(() => {
      let currentClaimed = claimedBalance;
      const now = Date.now();
      
      if (miningStartTime && stakedBalance > 0) {
        const elapsedSec = (now - miningStartTime) / 1000;
        const ratePerSec = ((stakedBalance * BASE_APY) / (365 * 24 * 3600)) * boostMultiplier;
        currentClaimed += (elapsedSec * ratePerSec);
      }

      const newStaked = stakedBalance + amount;
      const updatedHistory = addActivity('stake', amount, 'TON', 'Secure Node Stake');
      
      setStakedBalance(newStaked);
      setClaimedBalance(currentClaimed);
      setMiningStartTime(now);
      
      persist(newStaked, tonBalance, now, address, currentClaimed, updatedHistory, boostMultiplier, referralCount, activeStakers, onboardingComplete);
      toast.success(`Staked ${amount} TON Successfully`, { id: tid });
    }, 1000);
  };

  const handleClaim = (amount: number) => {
    const newClaimed = claimedBalance + amount;
    const now = Date.now();
    const updatedHistory = addActivity('claim', amount, 'SMART', 'Session Harvest');
    
    setClaimedBalance(newClaimed);
    setMiningStartTime(now);
    
    persist(stakedBalance, tonBalance, now, address, newClaimed, updatedHistory, boostMultiplier, referralCount, activeStakers, onboardingComplete);
    toast.success(`Harvested ${amount.toFixed(4)} SMART`, { icon: '✨' });
  };

  const handleWithdrawSmart = (amount: number) => {
    if (amount <= 0 || amount > claimedBalance || !address) return;
    const tid = toast.loading("Processing SMART Payout...");
    setTimeout(() => {
      const newClaimed = claimedBalance - amount;
      const updatedHistory = addActivity('withdraw_smart', amount, 'SMART', 'Main Wallet Payout', address);
      setClaimedBalance(newClaimed);
      persist(stakedBalance, tonBalance, miningStartTime, address, newClaimed, updatedHistory, boostMultiplier, referralCount, activeStakers, onboardingComplete);
      toast.success(`Sent ${amount.toFixed(2)} SMART to wallet`, { id: tid, icon: '🚀' });
    }, 1500);
  };

  const handleWithdrawTon = (amount: number) => {
    if (amount <= 0 || amount > tonBalance || !address) return;
    const tid = toast.loading("Executing TON Transfer...");
    setTimeout(() => {
      const newTon = tonBalance - amount;
      const updatedHistory = addActivity('withdraw_ton', amount, 'TON', 'External Transfer', address);
      setTonBalance(newTon);
      persist(stakedBalance, newTon, miningStartTime, address, claimedBalance, updatedHistory, boostMultiplier, referralCount, activeStakers, onboardingComplete);
      toast.success(`Sent ${amount.toFixed(2)} TON to wallet`, { id: tid, icon: '🏦' });
    }, 1200);
  };

  const handleConvertSmartToTon = (smartAmount: number) => {
    if (smartAmount <= 0 || smartAmount > claimedBalance) return;
    const tid = toast.loading("Converting SMART to TON...");
    setTimeout(() => {
      const tonGained = (smartAmount * marketData.smartPrice) / marketData.tonPrice;
      const newClaimed = claimedBalance - smartAmount;
      const newTon = tonBalance + tonGained;
      const updatedHistory = addActivity('convert_smart', smartAmount, 'SMART', `Auto-Swap`);
      
      setClaimedBalance(newClaimed);
      setTonBalance(newTon);
      persist(stakedBalance, newTon, miningStartTime, address, newClaimed, updatedHistory, boostMultiplier, referralCount, activeStakers, onboardingComplete);
      toast.success(`Gained ${tonGained.toFixed(4)} TON`, { id: tid, icon: '🔄' });
    }, 1200);
  };

  const handlePurchase = (cost: number, boostAdd: number, label: string) => {
    if (claimedBalance < cost) return;
    const newClaimed = claimedBalance - cost;
    const newBoost = boostMultiplier + boostAdd;
    const updatedHistory = addActivity('purchase', cost, 'SMART', label);
    
    setClaimedBalance(newClaimed);
    setBoostMultiplier(newBoost);
    persist(stakedBalance, tonBalance, miningStartTime, address, newClaimed, updatedHistory, newBoost, referralCount, activeStakers, onboardingComplete);
    toast.success(`${label} Activated!`, { icon: '🔥' });
  };

  const renderContent = () => {
    if (!address) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700 px-6 max-w-sm mx-auto">
          <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[36px] shadow-2xl flex items-center justify-center text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-white/5 relative group">
             <div className="absolute inset-0 bg-green-500/20 rounded-[36px] animate-pulse blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <Wallet size={48} className="relative z-10" />
          </div>
          <div className="space-y-3">
             <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Smart Stake AI</h1>
             <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-4">
               Secure your position in the AI future. High-yield staking and decentralized mining on TON.
             </p>
          </div>
          <TonConnectButton/>
        </div>
      );
    }

    if (showOnboarding) {
      return <OnboardingScreen onComplete={completeOnboarding} />;
    }

    switch (activeTab) {
      case 'home':
        return <MiningScreen stakedAmount={stakedBalance} claimedAmount={claimedBalance} startTime={miningStartTime} boostMultiplier={boostMultiplier} onStake={handleStake} onUnstake={() => toast.error("TON is locked in Phase 1")} onClaim={handleClaim} marketData={marketData} />;
      case 'wallet':
        return <WalletScreen address={address} claimedAmount={claimedBalance} stakedAmount={stakedBalance} tonBalance={tonBalance} activities={activities} onWithdrawSmart={handleWithdrawSmart} onWithdrawTon={handleWithdrawTon} onConvertSmartToTon={handleConvertSmartToTon} marketData={marketData} />;
      case 'invite':
        return <InviteScreen address={address} referralCount={referralCount} activeStakers={activeStakers} />;
      case 'market':
        return <MarketplaceScreen claimedBalance={claimedBalance} onPurchase={handlePurchase} currentBoost={boostMultiplier} />;
      case 'swap':
        return <SwapScreen claimedBalance={claimedBalance} marketData={marketData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center transition-colors duration-300">
      {isLoadingApp && <LoadingScreen />}
      
      <header className="w-full max-w-md px-6 py-5 sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3 group">
             {user?.photoUrl ? (
              <img src={user.photoUrl} alt="User" className="w-10 h-10 rounded-full border-2 border-green-600/70" />
            ) : (
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-green-200 dark:shadow-none transition-all group-hover:rotate-12 group-hover:scale-110">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-black text-slate-900 dark:text-white tracking-tight text-lg">Smart Stake AI</span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-1">
                  Welcome, {user?.first_name} {user?.last_name}
                </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
           
            <button onClick={toggleTheme} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-green-500 transition-all shadow-sm">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {/* {connectedAddressString && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase shadow-sm">
                <Shield size={10} className="text-green-500" />
                {connectedAddressString.slice(0, 6)}...{connectedAddressString.slice(-4)}
              </div>
            )} */}
             {connectedAddressString && (
              <button
                onClick={handleLogout}
                className="p-2.5 bg-white dark:bg-slate-900 border border-red-500/30 rounded-xl text-red-500 hover:text-red-400 transition-all shadow-sm hover:bg-red-500/5 hover:border-red-500/50"
                title="Disconnect Wallet"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">SMART =</span>
             <span className="text-[10px] font-black text-slate-900 dark:text-white">${marketData.smartPrice}</span>
             <span className="text-[9px] font-black text-green-500 flex items-center gap-0.5"><TrendingUp size={10} /> {marketData.smartChange}</span>
           </div>
           <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/10" />
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">TON =</span>
             <span className="text-[10px] font-black text-slate-900 dark:text-white">${marketData.tonPrice.toFixed(2)}</span>
           </div>
        </div>
      </header>
      
      <main className="w-full max-w-md flex-1 flex flex-col px-6 py-2 pb-32 overflow-x-hidden">
        {renderContent()}
      </main>

      {address && !showOnboarding && (
        <nav className="fixed bottom-6 inset-x-6 max-w-md mx-auto z-50">
          <div className="bg-slate-900/95 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-2 flex justify-between items-center shadow-2xl border border-white/10 ring-1 ring-white/5">
            <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={22} />} label="Home" />
            <NavButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<ReceiptText size={22} />} label="Assets" />
            <NavButton active={activeTab === 'swap'} onClick={() => setActiveTab('swap')} icon={<ArrowLeftRight size={22} />} label="Swap" />
            <NavButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<Store size={22} />} label="Market" />
            <NavButton active={activeTab === 'invite'} onClick={() => setActiveTab('invite')} icon={<Users size={22} />} label="Invite" />
          </div>
        </nav>
      )}
      
      <Toaster position="top-center" toastOptions={{ className: 'mobile-toast', style: { borderRadius: '24px', background: theme === 'dark' ? '#0f172a' : '#1e293b', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '14px 22px', maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }}} />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-[24px] transition-all duration-300 relative ${active ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110 translate-y-[-2px]' : 'scale-100'}`}>{icon}</div>
    <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    {active && <div className="absolute bottom-1.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,1)]" />}
  </button>
);

export default App;
