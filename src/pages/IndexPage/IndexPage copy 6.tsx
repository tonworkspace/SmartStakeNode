
// import React, { useState, useEffect, useCallback } from 'react';
// import { MiningScreen } from '@/AiComponents/MiningScreen';
// import { MarketplaceScreen } from '@/AiComponents/MarketplaceScreen';
// import { WalletScreen } from '@/AiComponents/WalletScreen';
// import { InviteScreen } from '@/AiComponents/InviteScreen';
// import { SwapScreen } from '@/AiComponents/SwapScreen';
// import { NotificationCenter } from '@/AiComponents/NotificationCenter';
// import { OnboardingWizard } from '@/AiComponents/OnboardingWizard';
// import { UserProfileModal } from '@/AiComponents/UserProfileModal';
// import { UserAvatar } from '@/AiComponents/UserAvatar';
// import { Toaster, toast } from 'react-hot-toast';
// import { Wallet, Home, ReceiptText, Store, TrendingUp, ArrowLeftRight, Users, Sun, Moon, Bell, Check, Loader2 } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';

// export interface ActivityRecord {
//   id: string;
//   type: 'stake' | 'unstake' | 'claim' | 'purchase' | 'withdraw_smart';
//   amount: number;
//   token: 'TON' | 'SMART';
//   timestamp: number;
//   label?: string;
//   txHash?: string;
//   status?: 'pending' | 'completed';
// }

// export interface PlatformNotification {
//   id: string;
//   title: string;
//   message: string;
//   type: 'announcement' | 'market' | 'alert';
//   timestamp: number;
//   isRead: boolean;
// }

// export interface UserProfile {
//   username: string;
//   firstName?: string;
//   lastName?: string;
//   isBoarded: boolean;
//   joinedAt: number;
//   telegramId?: number;
//   isTelegramVerified?: boolean;
//   languageCode?: string;
//   invitedBy?: string;
// }

// export interface Referral {
//   id: string;
//   username: string;
//   earned: number;
//   joinedAt: number;
// }

// export interface UpgradeState {
//   turbo: number; // Level 0-5
//   vault: number; // Level 0-5
//   quantum: number; // Level 0-5
//   network: number; // Level 0-5
// }

// export const CONSTANTS = {
//   APY: 0.150,
//   SMART_PRICE: 0.428,
//   TON_PRICE: 5.24,
//   SMART_CHANGE: '+12.4%',
//   APP_VERSION: 'v1.14.2-Stable',
//   STORAGE_KEY: 'smart_stake_v114_stable',
//   MIN_WITHDRAWAL: 1.0,
//   GAS_FEE: 0.05,
//   BOT_USERNAME: 'SmartStakeAI_Bot'
// };

// const IndexPage: React.FC = () => {
//   const { user: dbUser, isLoading: authLoading, updateUserData } = useAuth();
//   const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'invite' | 'market' | 'swap'>('home');
//   const [address, setAddress] = useState<string | null>(null);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isOnboarding, setIsOnboarding] = useState(false);
//   const [isProfileOpen, setIsProfileOpen] = useState(false);
  
//   // Balances
//   const [stakedBalance, setStakedBalance] = useState<number>(0);
//   const [liquidTon, setLiquidTon] = useState<number>(0); 
//   const [claimedBalance, setClaimedBalance] = useState<number>(0);
  
//   // State
//   const [miningStartTime, setMiningStartTime] = useState<number | null>(null);
//   const [activities, setActivities] = useState<ActivityRecord[]>([]);
//   const [upgradeLevels, setUpgradeLevels] = useState<UpgradeState>({ turbo: 0, vault: 0, quantum: 0, network: 0 });
//   const [theme, setTheme] = useState<'light' | 'dark'>('light');
//   const [isNotifOpen, setIsNotifOpen] = useState(false);
//   const [, setIsInitialized] = useState(false);
//   const [referrals, setReferrals] = useState<Referral[]>([]);

//   const [notifications, setNotifications] = useState<PlatformNotification[]>([
//     {
//       id: '1',
//       title: 'Protocol Finalized',
//       message: 'Network synchronization and referral gateways are now active.',
//       type: 'announcement',
//       timestamp: Date.now(),
//       isRead: false
//     }
//   ]);

//   // Set states from database user
//   useEffect(() => {
//     if (dbUser) {
//       setUserProfile({
//         username: dbUser.username ?? 'Unknown',
//         firstName: dbUser.first_name,
//         lastName: dbUser.last_name,
//         isBoarded: true,
//         joinedAt: dbUser.created_at ? new Date(dbUser.created_at).getTime() : Date.now(),
//         telegramId: dbUser.telegram_id,
//         isTelegramVerified: true,
//         languageCode: dbUser.language_code,
//         invitedBy: dbUser.sponsor_id ? String(dbUser.sponsor_id) : undefined
//       });
//       setStakedBalance(dbUser.stake || 0);
//       setLiquidTon(dbUser.available_balance || 0);
//       setClaimedBalance(dbUser.total_earned || 0);
//       setAddress(`UQ_TG_${dbUser.telegram_id}`);
//     }
//   }, [dbUser]);

//   const calculateTotalBoost = useCallback(() => {
//     const turboBoost = upgradeLevels.turbo * 0.15;
//     const quantumBoost = upgradeLevels.quantum * 0.50;
//     const vaultBoost = upgradeLevels.vault * 0.05;
//     const networkBoost = upgradeLevels.network * 0.10;
//     const referralBoost = referrals.length * 0.05; 
//     return 1.0 + turboBoost + quantumBoost + vaultBoost + networkBoost + referralBoost;
//   }, [upgradeLevels, referrals]);

//   const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
//     const tg = window.Telegram?.WebApp;
//     if (tg?.HapticFeedback) {
//       if (['success', 'warning', 'error'].includes(type)) {
//         tg.HapticFeedback.notificationOccurred(type as any);
//       } else {
//         tg.HapticFeedback.impactOccurred(type as any);
//       }
//     }
//   };

//   useEffect(() => {
//     const tg = window.Telegram?.WebApp;
//     if (tg) {
//       tg.ready();
//       tg.expand();
//     }

//     const saved = localStorage.getItem(CONSTANTS.STORAGE_KEY);
//     let localProfile: UserProfile | null = null;
//     if (saved) {
//       try {
//         const p = JSON.parse(saved);
//         setStakedBalance(p.staked || 0);
//         setLiquidTon(p.liquidTon ?? 0);
//         setMiningStartTime(p.startTime || null);
//         setAddress(p.address || null);
//         setClaimedBalance(p.claimed || 0);
//         setActivities(p.activities || []);
//         setUpgradeLevels(p.upgradeLevels || { turbo: 0, vault: 0, quantum: 0, network: 0 });
//         localProfile = p.profile || null;
//         setReferrals(p.referrals || []);
//         if (p.notifications) setNotifications(p.notifications);
//       } catch (e) {
//         console.error("State recovery failed", e);
//       }
//     }

//     const isInsideTelegram = tg && tg.initData !== '';
//     let currentTgUser: any = null;
//     if (isInsideTelegram) {
//       currentTgUser = tg.initDataUnsafe?.user;
//     } else {
//       currentTgUser = { id: 999123456, first_name: "Developer", username: "SmartDev", language_code: "en" };
//     }

//     if (currentTgUser) {
//       const syncedProfile: UserProfile = {
//         username: localProfile?.username || currentTgUser.username || currentTgUser.first_name,
//         firstName: currentTgUser.first_name,
//         lastName: currentTgUser.last_name,
//         isBoarded: localProfile?.isBoarded ?? false,
//         joinedAt: localProfile?.joinedAt || Date.now(),
//         telegramId: currentTgUser.id,
//         isTelegramVerified: true,
//         languageCode: currentTgUser.language_code,
//         invitedBy: localProfile?.invitedBy
//       };

//       const startParam = tg?.initDataUnsafe?.start_param;
//       if (startParam && !syncedProfile.invitedBy) {
//         syncedProfile.invitedBy = startParam;
//         setTimeout(() => {
//           toast.success(`Linked to Inviter: ${startParam}`, { icon: '🔗' });
//           triggerHaptic('success');
//         }, 3000);
//       }

//       setUserProfile(syncedProfile);
//       if (!address) setAddress(`UQ_TG_${currentTgUser.id.toString(16).toUpperCase()}`);
//       if (!syncedProfile.isBoarded) setIsOnboarding(true);
//     }

//     const savedTheme = localStorage.getItem('smart_stake_theme') as 'light' | 'dark';
//     if (savedTheme) setTheme(savedTheme);
//     else if (tg?.colorScheme) setTheme(tg.colorScheme);

//     setIsInitialized(true);
//   }, []);


//   useEffect(() => {
//     if (theme === 'dark') document.documentElement.classList.add('dark');
//     else document.documentElement.classList.remove('dark');
    
//     const tg = window.Telegram?.WebApp;
//     if (tg) {
//       const color = theme === 'dark' ? '#020617' : '#f8fafc';
//       tg.setHeaderColor(color);
//     }
//     localStorage.setItem('smart_stake_theme', theme);
//   }, [theme]);

//   const handleRestoreState = (dataString: string) => {
//     try {
//       const parsed = JSON.parse(dataString);
//       if (typeof parsed.staked !== 'number' || !parsed.profile) throw new Error();
//       triggerHaptic('success');
//       localStorage.setItem(CONSTANTS.STORAGE_KEY, dataString);
//       window.location.reload();
//     } catch (e) {
//       triggerHaptic('error');
//       toast.error("Invalid Backup Protocol");
//     }
//   };

//   const handleCompleteOnboarding = (username: string) => {
//     triggerHaptic('success');
//     setUserProfile(prev => prev ? { ...prev, username, isBoarded: true } : null);
//     setIsOnboarding(false);
//     toast.success(`Access Granted: @${username}`);
//   };

//   const handleAddReferral = () => {
//     const usernames = ['TonExplorer', 'CryptoWhale', 'SmartMiner', 'DeFiKing', 'TNode'];
//     const randomUser = usernames[Math.floor(Math.random() * usernames.length)] + Math.floor(Math.random() * 999);
    
//     const newRef: Referral = {
//       id: Math.random().toString(36).substr(2, 9),
//       username: randomUser,
//       earned: 1.25,
//       joinedAt: Date.now()
//     };
    
//     setReferrals(prev => [newRef, ...prev]);
//     toast.success(`Node Connected: @${randomUser}`, { icon: '👥' });
//     triggerHaptic('medium');
//   };

//   const handleDepositTon = async (amount: number) => {
//     triggerHaptic('heavy');
//     const tid = toast.loading("Connecting to TON Bridge...");
//     setTimeout(() => {
//       const newLiquid = liquidTon + amount;
//       setLiquidTon(newLiquid);
//       const txHash = 'UQ' + Math.random().toString(36).substring(2, 15).toUpperCase();
//       addActivity('stake', amount, 'TON', 'External Deposit', txHash);
//       updateUserData({ available_balance: newLiquid });
//       toast.success(`Received ${amount} TON`, { id: tid });
//       triggerHaptic('success');
//     }, 1500);
//   };

//   const handleStake = async (amount: number) => {
//     if (liquidTon < amount) {
//       toast.error("Insufficient liquid TON.");
//       return;
//     }
//     triggerHaptic('heavy');
//     const tid = toast.loading("Staking Assets...");
//     setTimeout(() => {
//       const newLiquid = liquidTon - amount;
//       const newStaked = stakedBalance + amount;
//       setLiquidTon(newLiquid);
//       setStakedBalance(newStaked);
//       setMiningStartTime(prev => prev || Date.now());
//       addActivity('stake', amount, 'TON', 'Validator Staking');
//       updateUserData({ available_balance: newLiquid, stake: newStaked });
//       toast.success(`Staked ${amount} TON`, { id: tid });
//       triggerHaptic('success');
//     }, 1200);
//   };

//   const handleClaim = (amount: number) => {
//     triggerHaptic('medium');
//     const newClaimed = claimedBalance + amount;
//     setClaimedBalance(newClaimed);
//     setMiningStartTime(Date.now());
//     addActivity('claim', amount, 'SMART', 'Yield Harvest');
//     updateUserData({ total_earned: newClaimed });
//     toast.success(`${amount.toFixed(4)} SMART Harvested`);
//   };

//   const handlePurchaseUpgrade = (id: string, cost: number, currency: 'TON' | 'SMART', label: string) => {
//     const currentBalance = currency === 'TON' ? liquidTon : claimedBalance;
//     const currentLevel = upgradeLevels[id as keyof UpgradeState];

//     if (currentLevel >= 5) {
//       toast.error(`${label} is at Max Level`);
//       return;
//     }

//     if (currentBalance < cost) {
//       triggerHaptic('error');
//       toast.error(`Insufficient ${currency} balance`);
//       return;
//     }

//     triggerHaptic('heavy');
//     const tid = toast.loading(`Upgrading ${label}...`);
    
//     setTimeout(() => {
//       const newLiquid = currency === 'TON' ? liquidTon - cost : liquidTon;
//       const newClaimed = currency === 'SMART' ? claimedBalance - cost : claimedBalance;
//       if (currency === 'TON') setLiquidTon(newLiquid);
//       else setClaimedBalance(newClaimed);

//       setUpgradeLevels(prev => ({
//         ...prev,
//         [id]: prev[id as keyof UpgradeState] + 1
//       }));

//       addActivity('purchase', cost, currency, `${label} Upgrade`);
//       updateUserData({ available_balance: newLiquid, total_earned: newClaimed });
//       toast.success(`${label} Level ${currentLevel + 1} active!`, { id: tid });
//       triggerHaptic('success');
//     }, 1000);
//   };

//   const addActivity = (type: ActivityRecord['type'], amount: number, token: ActivityRecord['token'], label?: string, txHash?: string) => {
//     const newActivity: ActivityRecord = {
//       id: Math.random().toString(36).substr(2, 9),
//       type, amount, token, timestamp: Date.now(),
//       label, txHash, status: 'completed'
//     };
//     setActivities(prev => [newActivity, ...prev].slice(0, 50));
//   };

//   const renderContent = () => {
//     if (authLoading) {
//       return (
//         <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
//            <div className="relative">
//               <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse rounded-full" />
//               <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
//            </div>
//            <div className="space-y-2">
//               <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Verifying</h1>
//               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">SmartStake &middot; Blockchain Handshake</p>
//            </div>
//         </div>
//       );
//     }

//     if (!address) {
//       return (
//         <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 px-6 max-w-sm mx-auto">
//           <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl flex items-center justify-center text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-white/5">
//              <Wallet size={40} />
//           </div>
//           <div className="space-y-3">
//              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Sync Failure</h1>
//              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">Verification failed. Re-open from Telegram.</p>
//           </div>
//         </div>
//       );
//     }

//     if (isOnboarding) return <OnboardingWizard onComplete={handleCompleteOnboarding} initialUsername={userProfile?.username} />;

//     switch (activeTab) {
//       case 'home':
//         return (
//           <MiningScreen 
//             stakedAmount={stakedBalance} 
//             liquidAmount={liquidTon}
//             claimedAmount={claimedBalance}
//             startTime={miningStartTime} 
//             boostMultiplier={calculateTotalBoost()}
//             onStake={handleStake}
//             onDeposit={handleDepositTon}
//             onUnstake={() => toast.error("TON is locked during Genesis Phase")}
//             onClaim={handleClaim}
//           />
//         );
//       case 'wallet':
//         return <WalletScreen claimedAmount={claimedBalance} stakedAmount={stakedBalance} activities={activities} onWithdrawSmart={() => {}} address={address} />;
//       case 'invite':
//         return <InviteScreen address={address} telegramId={userProfile?.telegramId} referrals={referrals} onSimulateJoin={handleAddReferral} />;
//       case 'market':
//         return (
//           <MarketplaceScreen 
//             claimedBalance={claimedBalance} 
//             liquidTon={liquidTon}
//             onPurchaseUpgrade={handlePurchaseUpgrade} 
//             upgradeLevels={upgradeLevels}
//             currentBoost={calculateTotalBoost()} 
//           />
//         );
//       case 'swap':
//         return <SwapScreen claimedBalance={claimedBalance} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center transition-colors duration-300">
//       <header className="w-full max-w-sm px-4 py-4 sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b dark:border-white/5">
//         <div className="flex justify-between items-center mb-3">
//           <button onClick={() => { triggerHaptic('light'); userProfile?.isBoarded && setIsProfileOpen(true); }} className="flex items-center gap-3 group text-left outline-none">
//             <div className="relative">
//               <UserAvatar username={userProfile?.username || "S"} size="sm" />
//               {userProfile?.isTelegramVerified && (
//                 <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-white dark:border-slate-900">
//                   <Check size={8} strokeWidth={4} />
//                 </div>
//               )}
//             </div>
//             <div className="flex flex-col">
//               <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm">SmartStake</span>
//               {userProfile?.isBoarded && <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">@{userProfile.username || 'Unknown'}</span>}
//             </div>
//           </button>

//           <div className="flex items-center gap-2">
//             <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 hover:text-green-500 transition-all">
//               {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
//             </button>
//             <button onClick={() => setIsNotifOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 hover:text-green-500 transition-all relative">
//               <Bell size={18} />
//               {notifications.some(n => !n.isRead) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />}
//             </button>
//           </div>
//         </div>
        
//         <div className="flex items-center justify-between px-4 py-2 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
//            <div className="flex items-center gap-2">
//              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1 SMART =</span>
//              <span className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">${CONSTANTS.SMART_PRICE}</span>
//              <span className="text-[9px] font-black text-green-500 flex items-center gap-0.5"><TrendingUp size={10} /> {CONSTANTS.SMART_CHANGE}</span>
//            </div>
//            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">PROD {CONSTANTS.APP_VERSION}</span>
//         </div>
//       </header>

//       <main className="w-full max-w-sm flex-1 flex flex-col px-4 py-2 pb-24 overflow-x-hidden">
//         {renderContent()}
//       </main>

//       {address && !isOnboarding && !authLoading && (
//         <>
//           <nav className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-50">
//             <div className="bg-slate-900/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] p-2 flex justify-between items-center shadow-2xl border border-white/10">
//               <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20} />} label="Stake" />
//               <NavButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<ReceiptText size={20} />} label="Wallet" />
//               <NavButton active={activeTab === 'swap'} onClick={() => setActiveTab('swap')} icon={<ArrowLeftRight size={20} />} label="Swap" />
//               <NavButton active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<Store size={20} />} label="Upgrades" />
//               <NavButton active={activeTab === 'invite'} onClick={() => setActiveTab('invite')} icon={<Users size={20} />} label="Team" />
//             </div>
//           </nav>
//         </>
//       )}

//       <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} notifications={notifications} onMarkRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} />
//       <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={userProfile} address={address} stakedAmount={stakedBalance} claimedAmount={claimedBalance} onDisconnect={() => { localStorage.removeItem(CONSTANTS.STORAGE_KEY); window.location.reload(); }} onRestore={handleRestoreState} />
//       <Toaster position="top-center" toastOptions={{ style: { borderRadius: '24px', background: theme === 'dark' ? '#0f172a' : '#1e293b', color: '#fff', fontSize: '12px', fontWeight: '600' } }} />
//     </div>
//   );
// };

// const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
//   <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all relative ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
//     {icon}
//     <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
//     {active && <div className="absolute -bottom-0.5 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]" />}
//   </button>
// );

// export default IndexPage;
