import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed
import useAuth from '@/hooks/useAuth'; // Adjust path as needed
import ReferralContest from './ReferralContest'; // Adjust path as needed
import { toast } from 'react-hot-toast'; // Ensure you have this installed
import {
  Gift,
  Copy,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Loader2,
  Trash2,
  RefreshCw,
  User,
} from 'lucide-react';

// --- Interfaces ---
interface ReferralWithUsers {
  id: number;
  sponsor_id: number;
  referred_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  level: number;
  sponsor: { username: string; telegram_id: number; };
  referred: {
    username: string;
    telegram_id: number;
    total_earned: number;
    total_deposit: number;
    rank: string;
    is_premium: boolean;
    is_active: boolean;
  };
  sbt_amount: number;
  total_sbt_earned: number;
}

interface SponsorStat {
  sponsor_id: number;
  username: string;
  referral_count: number;
  active_referrals: number;
  total_earned: number;
  total_deposit: number;
}

interface UserSponsor {
  id: number;
  username: string;
  telegram_id: number;
  total_earned: number;
  total_deposit: number;
  rank: string;
  is_premium: boolean;
  created_at: string;
}

// --- Constants ---
const LEADERBOARD_REFRESH_INTERVAL = 30_000;

// --- Helper ---
const isRecentlyJoined = (dateString: string): boolean => {
  const joinDate = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) <= 7;
};

const ReferralSystem = () => {
  const { user } = useAuth();
  
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [userReferrals, setUserReferrals] = useState<ReferralWithUsers[]>([]);
  const [userReferralCount, setUserReferralCount] = useState<number>(0);
  const [, setUserActiveReferrals] = useState<number>(0);
  const [activeReferralReward, setActiveReferralReward] = useState<number>(0);
  
  // Sponsor/Upline State
  const [userSponsor, setUserSponsor] = useState<UserSponsor | null>(null);
  const [isLoadingSponsor, setIsLoadingSponsor] = useState(true);
  const [sponsorJustAdded, setSponsorJustAdded] = useState(false);
  
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'network' | 'leaderboard'>('network');
  const [showReferralContest, setShowReferralContest] = useState(false);
  
  // Leaderboard
  const [topReferrers, setTopReferrers] = useState<SponsorStat[]>([]);
  const [isLoadingLeaderboards, setIsLoadingLeaderboards] = useState(false);
  const [, setTotalSponsors] = useState(0);

  // Duplicates
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // UI State
  const [copied, setCopied] = useState(false);

  // --- Logic: Calculations ---
  const referralLink = user?.id ? `https://t.me/SmartStakeAI_Bot?startapp=${user.telegram_id}` : "Loading...";

  const calculateActiveReferralReward = (referrals: ReferralWithUsers[]): number => {
    return referrals.reduce((total, referral) => {
      if (referral.status === 'active') {
        return total + (referral.referred?.is_premium ? 2000 : 50);
      }
      return total;
    }, 0);
  };

  const updateReferralStats = (referrals: ReferralWithUsers[]) => {
    const activeCount = referrals.filter(r => r.status === 'active').length;
    setUserReferralCount(referrals.length);
    setUserActiveReferrals(activeCount);
    setActiveReferralReward(calculateActiveReferralReward(referrals));
  };

  // --- Data Fetching ---

  // 1. Load User Sponsor/Upline
  const loadUserSponsor = async () => {
    if (!user?.id) return;
    setIsLoadingSponsor(true);
    try {
      // Use the sponsor_id directly from the user object if available
      let sponsorId = user.sponsor_id;
      
      // If sponsor_id is not in the user object, fetch it from the database
      if (!sponsorId) {
        console.log('Sponsor ID not in user object, fetching from database...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('sponsor_id')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user sponsor_id:', userError);
          throw userError;
        }
        
        sponsorId = userData?.sponsor_id;
      }
      
      if (sponsorId) {
        console.log('Loading sponsor data for sponsor_id:', sponsorId);
        
        // Get the sponsor's details
        const { data: sponsorData, error: sponsorError } = await supabase
          .from('users')
          .select(`
            id,
            username,
            telegram_id,
            total_earned,
            total_deposit,
            rank,
            is_premium,
            created_at
          `)
          .eq('id', sponsorId)
          .single();

        if (sponsorError) {
          console.error('Error fetching sponsor data:', sponsorError);
          throw sponsorError;
        }

        if (sponsorData) {
          console.log('Sponsor data loaded:', sponsorData);
          const wasNull = userSponsor === null;
          setUserSponsor(sponsorData);
          
          // Show animation if sponsor was just added
          if (wasNull && sponsorData) {
            setSponsorJustAdded(true);
            setTimeout(() => setSponsorJustAdded(false), 3000);
          }
        } else {
          console.log('No sponsor data found for sponsor_id:', sponsorId);
          setUserSponsor(null);
        }
      } else {
        console.log('No sponsor_id found for user:', user.id);
        setUserSponsor(null);
      }
    } catch (err) {
      console.error('Error loading sponsor:', err);
      setUserSponsor(null);
    } finally {
      setIsLoadingSponsor(false);
    }
  };

  // 2. Load User Referrals
  const loadUserReferrals = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          sponsor:users!sponsor_id(username, telegram_id),
          referred:users!referred_id(username, telegram_id, total_earned, total_deposit, rank, is_premium, is_active),
          sbt_amount,
          total_sbt_earned
        `)
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []) as unknown as ReferralWithUsers[];
      setUserReferrals(typedData);
      updateReferralStats(typedData);
    } catch (err) {
      console.error('Error loading referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Load Leaderboard
  const loadLeaderboard = async () => {
    setIsLoadingLeaderboards(true);
    try {
      const { data: rawData, error } = await supabase
        .from('referrals')
        .select(`
          sponsor_id,
          status,
          sponsor:users!sponsor_id(username, total_earned, total_deposit)
        `)
        .not('sponsor_id', 'is', null) 
        .limit(10000); 

      if (error || !rawData) {
          setTopReferrers([]);
          return;
      }

      const counts = rawData.reduce((acc: { [key: string]: SponsorStat }, curr: any) => {
        const id = curr.sponsor_id;
        if (!id) return acc;
        const sponsorData = Array.isArray(curr.sponsor) ? curr.sponsor[0] : curr.sponsor;

        if (!acc[id]) {
          acc[id] = {
            sponsor_id: id,
            username: sponsorData?.username || `User ${id}`, 
            referral_count: 0,
            active_referrals: 0,
            total_earned: sponsorData?.total_earned || 0,
            total_deposit: sponsorData?.total_deposit || 0,
          };
        }
        acc[id].referral_count++;
        if ((curr.status || '').toLowerCase() === 'active') {
            acc[id].active_referrals++;
        }
        return acc;
      }, {});

      const sortedStats = Object.values(counts)
        .sort((a: SponsorStat, b: SponsorStat) => {
            if (b.active_referrals !== a.active_referrals) return b.active_referrals - a.active_referrals;
            return b.referral_count - a.referral_count;
        })
        .slice(0, 25);

      setTotalSponsors(Object.keys(counts).length);
      setTopReferrers(sortedStats);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoadingLeaderboards(false);
    }
  };

  // 3. Duplicate Handling
  const checkForDuplicates = async () => {
    if (!user?.id) return;
    setIsCheckingDuplicates(true);
    try {
        const { data } = await supabase.from('referrals').select('id, sponsor_id, referred_id').eq('sponsor_id', user.id);
        const map = new Map<string, number>();
        let dupes = 0;
        data?.forEach(r => {
            const key = `${r.sponsor_id}_${r.referred_id}`;
            if(map.has(key)) dupes++;
            else map.set(key, 1);
        });
        setDuplicateCount(dupes);
        if(dupes > 0) toast.error(`Found ${dupes} duplicate referrals.`);
        else toast.success("No duplicates found.");
    } catch (e) { console.error(e); }
    finally { setIsCheckingDuplicates(false); }
  };

  const clearDuplicateReferrals = async () => {
      if(!confirm("Are you sure you want to remove duplicate referrals?")) return;
      try {
        const { data: allReferrals } = await supabase
            .from('referrals')
            .select('id, sponsor_id, referred_id, created_at')
            .eq('sponsor_id', user!.id)
            .order('created_at', { ascending: true }); 

        if (!allReferrals) return;

        const map = new Map<string, any[]>();
        const idsToDelete: number[] = [];

        allReferrals.forEach(ref => {
            const key = `${ref.sponsor_id}_${ref.referred_id}`;
            if (!map.has(key)) {
                map.set(key, [ref]);
            } else {
                map.get(key)!.push(ref);
                idsToDelete.push(ref.id);
            }
        });

        if (idsToDelete.length > 0) {
            await supabase.from('referrals').delete().in('id', idsToDelete);
            setDuplicateCount(0);
            loadUserReferrals(); 
            toast.success("Duplicates removed!");
        }
      } catch (error) {
          console.error("Error clearing duplicates:", error);
      }
  };

  // --- Effects ---
  useEffect(() => { 
    console.log('ReferralSystem: Initial load effect triggered');
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('User ID:', user?.id, 'Sponsor ID:', user?.sponsor_id);
    
    loadUserSponsor();
    loadUserReferrals(); 
    loadLeaderboard(); 
  }, [user?.id]);

  // Watch for changes in sponsor_id to refresh sponsor data
  useEffect(() => {
    console.log('User sponsor_id changed:', user?.sponsor_id);
    if (user?.sponsor_id) {
      loadUserSponsor();
    } else if (user && !user.sponsor_id) {
      // User exists but has no sponsor
      setUserSponsor(null);
      setIsLoadingSponsor(false);
    }
  }, [user?.sponsor_id, user?.id]);
  
  useEffect(() => {
      const sub = supabase.channel('public_referrals').on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'referrals'
      }, (payload) => {
          // Check if this is a new referral for the current user
          if (payload.eventType === 'INSERT' && payload.new?.sponsor_id === user?.id) {
            toast.success(`🎉 New referral joined your network!`);
          }
          
          loadUserReferrals();
          loadLeaderboard();
      }).subscribe();
      
      const userSub = supabase.channel('public_users').on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users'
      }, (payload) => {
          console.log('User table change detected:', payload);
          // Check if the current user's sponsor_id was updated
          if (payload.eventType === 'UPDATE' && payload.new?.id === user?.id) {
            console.log('Current user updated, old sponsor_id:', payload.old?.sponsor_id, 'new sponsor_id:', payload.new?.sponsor_id);
            if (payload.new?.sponsor_id !== payload.old?.sponsor_id) {
              console.log('Sponsor ID changed, reloading sponsor data');
              loadUserSponsor();
            }
          }
      }).subscribe();
      
      return () => { 
        supabase.removeChannel(sub);
        supabase.removeChannel(userSub);
      };
  }, [user?.id]);

  useEffect(() => {
      const interval = setInterval(loadLeaderboard, LEADERBOARD_REFRESH_INTERVAL);
      return () => clearInterval(interval);
  }, []);

  // const milestones = [
  //   {
  //     id: 'bronze',
  //     name: 'Bronze Miner',
  //     requirement: 10,
  //     reward: 'Permanent +0.05x Boost',
  //     icon: <Medal size={20} className="text-amber-600" />,
  //     bg: 'bg-amber-50 dark:bg-amber-900/10',
  //     badge: '🥉'
  //   },
  //   {
  //     id: 'silver',
  //     name: 'Silver Node',
  //     requirement: 50,
  //     reward: '+50 SMART One-time Bonus',
  //     icon: <Flame size={20} className="text-slate-400" />,
  //     bg: 'bg-slate-50 dark:bg-slate-800/20',
  //     badge: '🥈'
  //   },
  //   {
  //     id: 'whale',
  //     name: 'Whale Ambassador',
  //     requirement: 100,
  //     reward: '500 USDT Direct Payout',
  //     icon: <Trophy size={20} className="text-green-500" />,
  //     bg: 'bg-green-50 dark:bg-green-900/10',
  //     badge: '🏆'
  //   }
  // ];

  // --- Render ---

  if (showReferralContest) {
      return (
          <div className="flex flex-col h-full w-full px-4 pt-4 pb-24 bg-white dark:bg-black text-slate-900 dark:text-white">
              <button onClick={() => setShowReferralContest(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white mb-4 flex items-center gap-2 font-bold">
                  ← Back to Network
              </button>
              <ReferralContest 
                showSnackbar={(cfg) => console.log(cfg)} 
                onClose={() => setShowReferralContest(false)} 
              />
          </div>
      );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = "Join RhizaCore and start mining today! 🚀";
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    if ((window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.openTelegramLink(fullUrl);
    } else {
        window.open(fullUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500 pb-24 px-4 pt-4 min-h-full">
      
      {/* --- Header Section --- */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Refer & Earn</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Build the decentralized network of the future</p>
        </div>
        <div className="flex gap-2">
            {/* Utility Buttons (Clean Duplicates / Contest) */}
            <button 
                onClick={() => {
                   setIsCheckingDuplicates(true);
                   checkForDuplicates();
                }} 
                disabled={isCheckingDuplicates}
                className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors ${isCheckingDuplicates ? "animate-spin" : ""}`}
            >
                <RefreshCw size={18} />
            </button>
            {duplicateCount > 0 && (
                <button 
                    onClick={clearDuplicateReferrals}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-200 dark:border-red-900/30"
                >
                    <Trash2 size={18} />
                </button>
            )}
             {/* <button 
                onClick={() => setShowReferralContest(true)}
                className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-orange-500 border border-orange-200 dark:border-orange-900/30 flex items-center gap-2"
            >
                <Trophy size={18} />
            </button> */}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-center space-y-1">
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Total Network</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">{userReferralCount}</div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm text-center space-y-1">
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Pending Rewards</span>
            <div className="text-xl font-black text-slate-900 dark:text-white text-green-500">{activeReferralReward}</div>
         </div>
      </div>

      {/* Quick Stats */}
      {userReferralCount > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 p-4 rounded-[24px] border border-green-100 dark:border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center">
                <Trophy size={16} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">Network Builder</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  You've built a network of {userReferralCount} member{userReferralCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-green-600 dark:text-green-400">
                {Math.round((userReferralCount / Math.max(userReferralCount, 10)) * 100)}%
              </div>
              <div className="text-[8px] text-slate-400 font-bold uppercase">Growth</div>
            </div>
          </div>
        </div>
      )}

      {/* --- Upline/Sponsor Section --- */}
      {isLoadingSponsor ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-slate-400" size={20} />
          </div>
        </div>
      ) : userSponsor ? (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4 transition-all duration-500 ${sponsorJustAdded ? 'ring-2 ring-green-500/50 shadow-green-100 dark:shadow-none' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Your Sponsor
                {sponsorJustAdded && <span className="ml-2 text-green-500 animate-pulse">✨ NEW</span>}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Connected to the network</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
<div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                    <User size={20} />
                  </div>
                  {userSponsor.is_premium && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {userSponsor.username || `User ${userSponsor.telegram_id}`}
                    </span>
                    {userSponsor.is_premium && (
                      <span className="text-[8px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                      {userSponsor.rank || 'Novice'} Rank
                    </span> */}
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                     Sponsor ID: {userSponsor.telegram_id}
                    </span>
                  </div>
                </div>
              </div>
              {/* <div className="text-right">
                <div className="text-slate-900 dark:text-white text-sm font-black">
                  {Math.floor(userSponsor.total_earned || 0)}
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase">
                  Total Earned
                </div>
              </div> */}
            </div>
            
            {/* <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white dark:bg-slate-700 p-3 rounded-xl">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {Math.floor(userSponsor.total_deposit || 0)}
                </div>
                <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Total Deposit
                </div>
              </div>
              <div className="bg-white dark:bg-slate-700 p-3 rounded-xl">
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {new Date(userSponsor.created_at).toLocaleDateString()}
                </div>
                <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Joined
                </div>
              </div>
            </div> */}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] border border-slate-200 dark:border-white/5 border-dashed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-600 rounded-2xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-tight">No Sponsor</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">You joined directly</p>
            </div>
          </div>
        </div>
      )}

      {/* --- Referral Link Card --- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
             <Gift size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Referral Link</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Earn 10% for every invite</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
           <span className="flex-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase">
             {referralLink}
           </span>
           <button
            onClick={handleCopy}
            className="p-2.5 bg-white dark:bg-slate-700 rounded-xl text-slate-900 dark:text-white hover:text-green-500 dark:hover:text-green-400 border border-slate-100 dark:border-white/10 shadow-sm transition-all active:scale-90"
           >
             {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
           </button>
         </div>

        {/* Your Sponsor Code */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          <div className="text-center space-y-3">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Your Sponsor Code</div>
            <div className="flex items-center justify-center gap-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-wider">{user?.telegram_id || 'Loading...'}</div>
              <button
                onClick={() => {
                  if (user?.telegram_id) {
                    navigator.clipboard.writeText(user.telegram_id.toString());
                    toast.success("Sponsor code copied!");
                  }
                }}
                className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-900 dark:text-white hover:text-green-500 dark:hover:text-green-400 border border-slate-100 dark:border-white/10 shadow-sm transition-all active:scale-90"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Share this ID with people you invite</div>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 border dark:border-white/5"
        >
          <Share2 size={16} />
          Share Referral Link
        </button>
      </div>

      {/* --- Dynamic Milestones Roadmap --- */}
      {/* <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-slate-400 dark:text-slate-600" />
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Achievement Roadmap</h3>
          </div>
          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{userActiveReferrals} Active</span>
        </div>

        <div className="space-y-3">
          {milestones.map((m) => {
            const isCompleted = userActiveReferrals >= m.requirement;
            const progress = Math.min((userActiveReferrals / m.requirement) * 100, 100);
            
            return (
              <div 
                key={m.id}
                className={`relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-[28px] border ${isCompleted ? 'border-green-100 dark:border-green-500/20 shadow-green-50 dark:shadow-none' : 'border-slate-100 dark:border-white/5 shadow-sm'} transition-all`}
              >
                {isCompleted && (
                  <div className="absolute top-0 right-0 p-3 text-green-500">
                    <CheckCircle2 size={16} />
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${m.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-black uppercase tracking-tight ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                        {m.name} {m.badge}
                      </h4>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-widest">
                      {isCompleted ? 'Unlocked' : `Requires ${m.requirement} Active Referrals`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-300 dark:text-slate-700'}`}>
                      {m.reward}
                    </span>
                    {!isCompleted && (
                      <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase">
                        {userActiveReferrals}/{m.requirement}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative h-2 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}

      {/* --- Lists (Tabs) --- */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex border border-slate-200 dark:border-white/5">
         <button 
           onClick={() => setActiveTab('network')}
           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'network' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
         >
           My Network
         </button>
         <button 
           onClick={() => setActiveTab('leaderboard')}
           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
         >
           Leaderboard
         </button>
      </div>

      <div className="space-y-3 pb-6">
         {isLoading || isLoadingLeaderboards ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>
         ) : activeTab === 'network' ? (
             userReferrals.length > 0 ? (
                 userReferrals.map((ref) => (
                    <div key={ref.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[20px] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <User size={18} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{ref.referred?.username || "Unknown"}</span>
                                {ref.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                                {isRecentlyJoined(ref.created_at) && <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-bold">NEW</span>}
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wide">
                                {ref.referred?.is_premium ? 'Premium Node' : 'Standard Node'}
                              </span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-green-500 text-sm font-black">
                             {ref.status === 'active' ? `+${ref.referred?.is_premium ? 2000 : 50}` : '0'}
                           </div>
                           <div className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase">
                             {ref.status === 'active' ? 'Earned' : 'Pending'}
                           </div>
                        </div>
                    </div>
                 ))
             ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    No referrals yet. Share your link!
                </div>
             )
         ) : (
             /* Leaderboard List */
             topReferrers.map((sponsor, idx) => (
                <div key={sponsor.sponsor_id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[20px] p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                          idx < 3 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                          {idx + 1}
                      </div>
                      <div>
                         <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{sponsor.username}</span>
                            {idx < 3 && <Trophy size={12} className="text-orange-500" />}
                         </div>
                         <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase">
                            Total Invites: {sponsor.referral_count}
                         </span>
                      </div>
                   </div>
                   <div className="text-right">
                       <div className="text-slate-900 dark:text-white text-sm font-black">{sponsor.active_referrals}</div>
                       <div className="text-[9px] text-green-500 font-bold uppercase">Active</div>
                   </div>
                </div>
             ))
         )}
      </div>

      {/* --- Security Info --- */}
      <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[28px] border border-slate-200 dark:border-white/5 border-dashed flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
           <ShieldCheck className="text-slate-400 dark:text-slate-600" size={20} />
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium leading-relaxed uppercase tracking-wider">
          Anti-Bot verification: Only referrals who have completed at least one 24h staking session are counted towards milestone rewards.
        </p>
      </div>
    </div>
  );
};

export default ReferralSystem;