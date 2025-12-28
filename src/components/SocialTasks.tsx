import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle2, 
  X, 
  MessageSquare, 
  Calendar, 
  Flame, 
  ChevronRight, 
  Star, 
  TrendingUp, 
  Gift,
  Loader2,
  Mail,
  Trophy,
  Users,
  Send,
  Repeat2,
  Heart,
  MessageCircle,
} from 'lucide-react';

// --- Interface Definitions ---
interface Task {
   id: string;
   title: string;
   description: string;
   reward: number;
   type: 'daily_login' | 'twitter_like' | 'twitter_retweet' | 'twitter_comment' | 'twitter_follow' | 'telegram' | 'telegram_community' | 'welcome_bonus' | 'email_verification' | 'facebook' | 'referral_contest';
   status: 'available' | 'completed' | 'claimed';
   icon?: string; // Legacy string icon
   action?: string;
   link?: string;
   currentStreak?: number;
   nextPotentialStreak?: number;
}

interface Props {
  showSnackbar: (config: { message: string; description?: string }) => void;
  userId?: number;
  onRewardClaimed?: (amount: number) => void;
  onNavigateToReferralContest?: () => void;
  updateUserBalance?: (userId: number, amount: number) => Promise<boolean>;
}

// --- Constants & Helpers ---
const WELCOME_BONUS_AMOUNT = 100;
// const X_TWEET_ID = '1986012576761745602';
// const X_HANDLE = 'RhizaCore';

// const getXIntentLink = (type: 'like' | 'retweet' | 'comment'): string => {
//   if (!X_TWEET_ID) return `https://x.com/${X_HANDLE}`;
//   if (type === 'like') return `https://twitter.com/intent/like?tweet_id=${X_TWEET_ID}`;
//   if (type === 'retweet') return `https://twitter.com/intent/retweet?tweet_id=${X_TWEET_ID}`;
//   return `https://twitter.com/intent/tweet?in_reply_to=${X_TWEET_ID}`;
// };

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getRewardByStreak = (streak: number): number => {
  if (streak === 7) return 10000;
  if (streak === 14) return 15000;
  if (streak === 21) return 20000;
  if (streak === 28) return 25000;
  return 500;
};

const clampStreakValue = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(30, Math.round(value)));
};

const getDaysSinceDate = (dateString: string | null | undefined): number | null => {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((todayUTC - targetUTC) / (1000 * 60 * 60 * 24));
};

const getGraceAllowance = (streak: number): number => {
  if (streak >= 21) return 2;
  if (streak >= 7) return 1;
  return 0;
};

const calculateSmartStreak = (currentStreak: number, daysSinceLastClaim: number | null): number => {
  const baseStreak = currentStreak || 0;
  if (daysSinceLastClaim === null) return clampStreakValue(baseStreak === 0 ? 1 : baseStreak + 1);
  if (daysSinceLastClaim <= 0) return clampStreakValue(baseStreak);
  if (daysSinceLastClaim === 1) return clampStreakValue(baseStreak + 1);
  const missedDays = daysSinceLastClaim - 1;
  const graceAllowance = getGraceAllowance(baseStreak);
  if (missedDays <= graceAllowance) return clampStreakValue(Math.max(1, baseStreak - missedDays));
  const penalty = missedDays - graceAllowance;
  const decayed = Math.max(1, Math.floor(baseStreak * Math.pow(0.85, penalty)));
  return clampStreakValue(decayed);
};

// --- Logic: Claim Daily Login ---
const claimDailyLoginReward = async (userId: number, updateUserBalance?: (userId: number, amount: number) => Promise<boolean>) => {
  try {
    const todayDateString = getTodayDateString();
    
    // Fetch user data with error handling
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('last_daily_claim_date, daily_streak_count')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch user data:', fetchError);
      throw new Error(fetchError.message || 'Failed to fetch user data');
    }
    
    if (!userData) {
      throw new Error('User data not found');
    }

    const { last_daily_claim_date, daily_streak_count } = userData;
    const daysSinceLastClaim = last_daily_claim_date ? getDaysSinceDate(last_daily_claim_date) : null;
    
    // Prevent duplicate claims
    if (daysSinceLastClaim !== null && daysSinceLastClaim <= 0) {
      throw new Error('Already claimed today');
    }

    const currentStreak = daily_streak_count || 0;
    const newStreak = calculateSmartStreak(currentStreak, daysSinceLastClaim);
    const reward = getRewardByStreak(newStreak);

    // Update user streak data
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        daily_streak_count: newStreak, 
        last_daily_claim_date: todayDateString 
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Failed to update user streak:', updateError);
      throw new Error('Failed to update streak data');
    }

    // Record activity with proper error handling
    const { error: activityError } = await supabase
      .from('activities')
      .insert({ 
        user_id: userId, 
        type: 'smart_claim', 
        amount: reward, 
        status: 'completed', 
        created_at: new Date().toISOString(),
        metadata: { 
          task_type: 'daily_login', 
          streak: newStreak,
          previous_streak: currentStreak
        }
      });
      
    if (activityError) {
      console.error('Failed to record daily login activity:', activityError);
      // Don't throw here as the main operation succeeded
    }

    // Update user balance using centralized function
    if (updateUserBalance) {
      const success = await updateUserBalance(userId, reward);
      if (!success) {
        console.warn('Centralized balance update failed, trying direct update');
        await updateSBTBalance(userId, reward);
      }
    } else {
      await updateSBTBalance(userId, reward);
    }
    
    // Update localStorage as backup
    const dailyClaimedKey = `daily_claimed_${userId}_${todayDateString}`;
    localStorage.setItem(dailyClaimedKey, 'true');

    return { reward, newStreak };
  } catch (error: any) {
    console.error('Daily login claim failed:', error);
    throw error;
  }
};

// --- Helper: Get Icon Component ---
const getTaskIcon = (type: string) => {
    switch (type) {
        case 'telegram': 
            return (
                <div className="relative">
                    <Send size={18} className="text-blue-500 dark:text-blue-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                    <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'telegram_community': 
            return (
                <div className="relative">
                    <MessageSquare size={18} className="text-blue-600 dark:text-blue-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                    <div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'twitter_like': 
            return (
                <div className="relative">
                    <Heart size={18} className="text-red-500 dark:text-red-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-red-600 dark:group-hover:text-red-300 group-hover:fill-red-500 dark:group-hover:fill-red-400" />
                    <div className="absolute inset-0 bg-red-500/20 dark:bg-red-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'twitter_retweet': 
            return (
                <div className="relative">
                    <Repeat2 size={18} className="text-green-500 dark:text-green-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-green-600 dark:group-hover:text-green-300 group-hover:rotate-180" />
                    <div className="absolute inset-0 bg-green-500/20 dark:bg-green-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'twitter_comment': 
            return (
                <div className="relative">
                    <MessageCircle size={18} className="text-blue-500 dark:text-blue-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
                    <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'twitter_follow': 
            return (
                <div className="relative">
                    <X size={18} className="text-slate-900 dark:text-white drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                    <div className="absolute inset-0 bg-slate-900/20 dark:bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'facebook': 
            return (
                <div className="relative">
                    <Users size={18} className="text-blue-700 dark:text-blue-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-blue-800 dark:group-hover:text-blue-300" />
                    <div className="absolute inset-0 bg-blue-700/20 dark:bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'welcome_bonus': 
            return (
                <div className="relative">
                    <Gift size={18} className="text-purple-600 dark:text-purple-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:rotate-12" />
                    <div className="absolute inset-0 bg-purple-600/20 dark:bg-purple-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'email_verification': 
            return (
                <div className="relative">
                    <Mail size={18} className="text-amber-600 dark:text-amber-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-amber-700 dark:group-hover:text-amber-300" />
                    <div className="absolute inset-0 bg-amber-600/20 dark:bg-amber-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'referral_contest': 
            return (
                <div className="relative">
                    <Trophy size={18} className="text-yellow-600 dark:text-yellow-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 group-hover:rotate-12" />
                    <div className="absolute inset-0 bg-yellow-600/20 dark:bg-yellow-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        case 'daily_login':
            return (
                <div className="relative">
                    <Flame size={18} className="text-orange-600 dark:text-orange-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-orange-700 dark:group-hover:text-orange-300 fill-orange-600 dark:fill-orange-400" />
                    <div className="absolute inset-0 bg-orange-600/20 dark:bg-orange-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
        default: 
            return (
                <div className="relative">
                    <Star size={18} className="text-slate-500 dark:text-slate-400 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                    <div className="absolute inset-0 bg-slate-500/20 dark:bg-slate-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            );
    }
};

const isSocialTask = (type: string): boolean => {
  return ['telegram', 'telegram_community', 'twitter_like', 'twitter_retweet', 'twitter_comment', 'twitter_follow', 'facebook'].includes(type);
};

// --- Helper Functions ---
const updateSBTBalance = async (userId: number, amount: number): Promise<void> => {
  try {
    // Try using the RPC function first
    const { error: sbtError } = await supabase.rpc('increment_sbt', {
      user_id: userId,
      amount: amount
    });

    if (sbtError) {
      console.warn('RPC increment_sbt failed, trying direct update:', sbtError);
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
          throw new Error(`Direct SBT update failed: ${updateError.message}`);
        }
      } else {
        throw new Error('User not found for SBT update');
      }
    }
  } catch (error) {
    console.error('Failed to update SBT balance:', error);
    throw error;
  }
};

// --- Main Component ---
const SocialTasks = ({ userId, onRewardClaimed, onNavigateToReferralContest, updateUserBalance }: Props) => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [, setUserData] = useState<{ last_daily_claim_date: string | null; daily_streak_count: number } | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  
  // Verification State
  const [verificationClicks, setVerificationClicks] = useState<{ [key: string]: number }>({});
  const [requiredClicks, setRequiredClicks] = useState<{ [key: string]: number }>({});
  
  // Email Form State
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState<{ [key: string]: boolean }>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // --- Helper Functions ---
  const refreshUserBalance = async () => {
    if (!userId) return;
    setIsBalanceLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('total_sbt')
        .eq('id', userId)
        .single();
      
      if (userData?.total_sbt !== undefined) {
        setUserBalance(Number(userData.total_sbt) || 0);
      }
    } catch (error) {
      console.error('Failed to refresh SBT balance:', error);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // --- Initial Data Definition ---
  const availableTasks: Task[] = useMemo(() => [
    // { 
    //   id: 'referral_contest', 
    //   title: 'Referral Championship', 
    //   description: 'Compete for 500USDT grand prize', 
    //   reward: 1000, 
    //   type: 'referral_contest', 
    //   status: 'available', 
    //   action: 'Enter Contest' 
    // },
    { 
      id: 'welcome_bonus', 
      title: 'Welcome to Smart Stake AI', 
      description: 'Your journey to financial freedom starts here', 
      reward: WELCOME_BONUS_AMOUNT, 
      type: 'welcome_bonus', 
      status: 'available', 
      action: 'Claim Bonus' 
    },
    { 
      id: 'email_verification', 
      title: 'Secure Your Account', 
      description: 'Protect your earnings with email verification', 
      reward: 50, 
      type: 'email_verification', 
      status: 'available', 
      action: 'Verify Now' 
    },
    { 
      id: 'daily_login', 
      title: 'Daily Check-In Rewards', 
      description: 'Build your streak for massive bonuses', 
      reward: 10, 
      type: 'daily_login', 
      status: 'available' 
    },
    // { 
    //   id: 'twitter_like', 
    //   title: 'Like Our Latest Update', 
    //   description: 'Show love for our AI-powered staking innovations', 
    //   reward: 75, 
    //   type: 'twitter_like', 
    //   status: 'available', 
    //   link: getXIntentLink('like') 
    // },
    // { 
    //   id: 'twitter_retweet', 
    //   title: 'Share the Revolution', 
    //   description: 'Help others discover the future of DeFi staking', 
    //   reward: 75, 
    //   type: 'twitter_retweet', 
    //   status: 'available', 
    //   link: getXIntentLink('retweet') 
    // },
    // { 
    //   id: 'twitter_follow', 
    //   title: 'Follow @SmartStakeAI', 
    //   description: 'Get exclusive updates on new features & rewards', 
    //   reward: 80, 
    //   type: 'twitter_follow', 
    //   status: 'available', 
    //   link: `https://x.com/${X_HANDLE}` 
    // },
    { 
      id: 'telegram', 
      title: 'Join Our Community', 
      description: 'Connect with 10K+ smart investors & get alpha', 
      reward: 10, 
      type: 'telegram', 
      status: 'available', 
      link: 'https://t.me/SmartStake_Channel' 
    },
    { 
      id: 'telegram_community', 
      title: 'Join Discussion Group', 
      description: 'Share strategies with fellow stakers', 
      reward: 10, 
      type: 'telegram_community', 
      status: 'available', 
      link: 'https://t.me/SmartStake_Official' 
    },
    // { 
    //   id: 'twitter_comment', 
    //   title: 'Share Your Success Story', 
    //   description: 'Comment about your staking experience', 
    //   reward: 60, 
    //   type: 'twitter_comment', 
    //   status: 'available', 
    //   link: getXIntentLink('comment') 
    // },
  ], []);

  // --- Logic: Data Loading ---
  const generateRequiredClicks = (taskId: string): number => {
    const seed = taskId + (userId || 0);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return Math.abs(hash % 3) + 3; // Random 3-5 clicks
  };

  const loadTaskStatus = async () => {
    if (!userId) { 
        setIsLoading(false); 
        return; 
    }
    
    try {
      const todayDateString = getTodayDateString();
      const tasksDataKey = `daily_tasks_${userId}`;
      const storedTasks = JSON.parse(localStorage.getItem(tasksDataKey) || '{}');
      
      // Initialize clicks
      const newRequiredClicks: { [key: string]: number } = {};
      availableTasks.forEach(t => { 
        if(isSocialTask(t.type)) newRequiredClicks[t.id] = generateRequiredClicks(t.id); 
      });
      setRequiredClicks(newRequiredClicks);

      // Check completed tasks from database
      const { data: completedTasks, error: completedTasksError } = await supabase
          .from('completed_tasks')
          .select('string_task_id, task_type')
          .eq('user_id', userId)
          .not('string_task_id', 'is', null);

      if (completedTasksError) {
          console.error('Failed to fetch completed tasks:', completedTasksError);
          toast.error('Failed to load task status');
      }

      const completedTaskIds = new Set(completedTasks?.map(ct => String(ct.string_task_id)) || []);
      const completedTaskTypes = new Set(completedTasks?.map(ct => ct.task_type) || []);
      
      // Get user data for daily login tracking
      const { data: userDataResponse, error: userDataError } = await supabase
          .from('users')
          .select('last_daily_claim_date, daily_streak_count, email, total_sbt')
          .eq('id', userId)
          .single();

      if (userDataError) {
          console.error('Failed to fetch user data:', userDataError);
          toast.error('Failed to load user data');
      }

      setUserData(userDataResponse);

      // Update balance state (now using total_sbt)
      if (userDataResponse?.total_sbt !== undefined) {
          setUserBalance(Number(userDataResponse.total_sbt) || 0);
      }

      // Local storage checks for tasks not yet in database
      const welcomeBonusGranted = localStorage.getItem(`welcome_bonus_granted_${userId}`) === 'true';
      const emailVerified = localStorage.getItem(`email_verified_${userId}`) === 'true';
      const contestJoined = localStorage.getItem(`referral_contest_joined_${userId}`) === 'true';

      const updatedTasks = availableTasks.map(task => {
        let status: 'available' | 'completed' | 'claimed' = 'available';
        
        // Check database completion first
        if (completedTaskIds.has(task.id) || completedTaskTypes.has(task.type)) {
            status = 'claimed';
        }
        // Fallback to localStorage for tasks not yet migrated to database
        else if (task.type === 'welcome_bonus' && welcomeBonusGranted) status = 'claimed';
        else if (task.type === 'email_verification' && (emailVerified || userDataResponse?.email)) status = 'claimed';
        else if (task.type === 'referral_contest' && contestJoined) status = 'claimed';
        
        if (task.type === 'daily_login' && userDataResponse) {
             const lastClaimed = userDataResponse.last_daily_claim_date;
             const claimedToday = lastClaimed === todayDateString;
             
             if (claimedToday) {
                 status = 'claimed';
                 task.currentStreak = userDataResponse.daily_streak_count || 0;
             } else {
                 task.currentStreak = userDataResponse.daily_streak_count || 0;
                 task.nextPotentialStreak = calculateSmartStreak(task.currentStreak || 0, getDaysSinceDate(lastClaimed));
                 task.reward = getRewardByStreak(task.nextPotentialStreak);
             }
        }

        // Check social tasks with fallback to localStorage
        if (isSocialTask(task.type) && status === 'available') {
            const isVerified = storedTasks[`${task.type}_verified`];
            if (isVerified) status = 'claimed';
        }

        return { ...task, status };
      });
      
      setTasks(updatedTasks);
    } catch (error: any) { 
        console.error('Failed to load task status:', error);
        toast.error('Failed to load tasks');
    } 
    finally { 
        setIsLoading(false); 
    }
  };

  useEffect(() => { 
    loadTaskStatus();
    refreshUserBalance(); // Load initial balance
  }, [userId]);

  // --- Logic: Interactions ---
  const handleVerificationClick = async (task: Task) => {
    if (task.status === 'claimed') return;
    const currentClicks = verificationClicks[task.id] || 0;
    const required = requiredClicks[task.id] || 3;

    if (task.link) window.open(task.link, '_blank');

    if (currentClicks + 1 >= required) {
        await verifySocialTask(task);
    } else {
        setVerificationClicks(prev => ({ ...prev, [task.id]: currentClicks + 1 }));
        toast(`Verification pending... (${currentClicks + 1}/${required})`, { icon: '⏳' });
    }
  };

  const verifySocialTask = async (task: Task) => {
      if (!userId) {
          toast.error('User not authenticated');
          return;
      }

      try {
          // Check if task is already completed in database
          const { data: existingCompletion } = await supabase
              .from('completed_tasks')
              .select('id')
              .eq('user_id', userId)
              .eq('string_task_id', task.id)
              .single();

          if (existingCompletion) {
              toast.error('Task already completed');
              return;
          }

          // Record task completion in database
          const { error: completionError } = await supabase
              .from('completed_tasks')
              .insert({
                  user_id: userId,
                  string_task_id: task.id,
                  task_type: task.type,
                  reward_amount: task.reward,
                  completed_at: new Date().toISOString()
              });

          if (completionError) {
              console.error('Failed to record task completion:', completionError);
              throw new Error('Failed to record task completion');
          }

          // Update localStorage as backup
          const tasksDataKey = `daily_tasks_${userId}`;
          const storedTasks = JSON.parse(localStorage.getItem(tasksDataKey) || '{}');
          storedTasks[`${task.type}_verified`] = true;
          localStorage.setItem(tasksDataKey, JSON.stringify(storedTasks));
          
          // Award Smart through activities system
          const { error: activityError } = await supabase
              .from('activities')
              .insert({ 
                  user_id: userId, 
                  type: 'smart_claim', 
                  amount: task.reward, 
                  status: 'completed',
                  created_at: new Date().toISOString(),
                  metadata: { task_id: task.id, task_type: task.type }
              });

          if (activityError) {
              console.error('Failed to record activity:', activityError);
              // Try without metadata if column doesn't exist
              const { error: fallbackActivityError } = await supabase
                  .from('activities')
                  .insert({ 
                      user_id: userId, 
                      type: 'smart_claim', 
                      amount: task.reward, 
                      status: 'completed',
                      created_at: new Date().toISOString()
                  });
              
              if (fallbackActivityError) {
                  console.error('Fallback activity recording also failed:', fallbackActivityError);
              }
          }

          // Update user balance using centralized function
          if (updateUserBalance) {
            const success = await updateUserBalance(userId, task.reward);
            if (!success) {
              console.warn('Centralized balance update failed, trying direct update');
              await updateSBTBalance(userId, task.reward);
            }
          } else {
            await updateSBTBalance(userId, task.reward);
          }

          if (onRewardClaimed) onRewardClaimed(task.reward);
          
          toast.success(`Task verified! +${task.reward} Smart (TON)`);
          
          // Refresh both task status and balance
          await Promise.all([
            loadTaskStatus(),
            refreshUserBalance()
          ]);
      } catch (error: any) {
          console.error('Task verification failed:', error);
          toast.error(error.message || 'Task verification failed');
      }
  };

  const handleClaimTask = async (task: Task) => {
    if (task.status === 'claimed' || isClaiming === task.id) return;
    
    // Contest Navigation
    if (task.type === 'referral_contest') {
        if (onNavigateToReferralContest) onNavigateToReferralContest();
        return;
    }

    if (!userId) {
        toast.error('User not authenticated');
        return;
    }

    setIsClaiming(task.id);
    try {
        if (task.type === 'daily_login') {
            const res = await claimDailyLoginReward(userId, updateUserBalance);
            if (onRewardClaimed) onRewardClaimed(res.reward);
            toast.success(`Daily Streak: ${res.newStreak} Days! +${res.reward} Smart (TON)`);
            
            // Refresh both task status and balance
            await Promise.all([
                loadTaskStatus(),
                refreshUserBalance()
            ]);
        } 
        else if (task.type === 'welcome_bonus') {
            // Check if already claimed in database
            const { data: existingCompletion } = await supabase
                .from('completed_tasks')
                .select('id')
                .eq('user_id', userId)
                .eq('task_type', 'welcome_bonus')
                .single();

            if (existingCompletion) {
                toast.error('Welcome bonus already claimed');
                setIsClaiming(null);
                return;
            }

            // Record in database
            await supabase.from('completed_tasks').insert({
                user_id: userId,
                string_task_id: task.id,
                task_type: task.type,
                reward_amount: task.reward,
                completed_at: new Date().toISOString()
            });

            // Record activity
            const { error: activityError } = await supabase.from('activities').insert({ 
                user_id: userId, 
                type: 'smart_claim', 
                amount: task.reward, 
                status: 'completed',
                created_at: new Date().toISOString(),
                metadata: { task_id: task.id, task_type: task.type }
            });

            if (activityError) {
                console.error('Failed to record welcome bonus activity:', activityError);
                // Try without metadata if column doesn't exist
                await supabase.from('activities').insert({ 
                    user_id: userId, 
                    type: 'smart_claim', 
                    amount: task.reward, 
                    status: 'completed',
                    created_at: new Date().toISOString()
                });
            }

            // Update SBT balance
            if (updateUserBalance) {
                const success = await updateUserBalance(userId, task.reward);
                if (!success) {
                    console.warn('Centralized balance update failed, trying direct update');
                    await updateSBTBalance(userId, task.reward);
                }
            } else {
                await updateSBTBalance(userId, task.reward);
            }

            localStorage.setItem(`welcome_bonus_granted_${userId}`, 'true');
            if (onRewardClaimed) onRewardClaimed(task.reward);
            toast.success(`Welcome Bonus Claimed! +${task.reward} Smart (TON)`);
            
            // Refresh both task status and balance
            await Promise.all([
                loadTaskStatus(),
                refreshUserBalance()
            ]);
        }
        else if (task.type === 'email_verification') {
            if (!emailInput.includes('@')) { 
                toast.error("Please enter a valid email address"); 
                setIsClaiming(null); 
                return; 
            }

            // Update user email and record completion
            const { error: emailUpdateError } = await supabase
                .from('users')
                .update({ email: emailInput })
                .eq('id', userId);

            if (emailUpdateError) {
                console.error('Failed to update email:', emailUpdateError);
                throw new Error('Failed to update email');
            }

            // Record task completion
            await supabase.from('completed_tasks').insert({
                user_id: userId,
                string_task_id: task.id,
                task_type: task.type,
                reward_amount: task.reward,
                completed_at: new Date().toISOString()
            });

            // Record activity
            const { error: activityError } = await supabase.from('activities').insert({ 
                user_id: userId, 
                type: 'smart_claim', 
                amount: task.reward, 
                status: 'completed',
                created_at: new Date().toISOString(),
                metadata: { task_id: task.id, task_type: task.type, email: emailInput }
            });

            if (activityError) {
                console.error('Failed to record email verification activity:', activityError);
                // Try without metadata if column doesn't exist
                await supabase.from('activities').insert({ 
                    user_id: userId, 
                    type: 'smart_claim', 
                    amount: task.reward, 
                    status: 'completed',
                    created_at: new Date().toISOString()
                });
            }

            // Update SBT balance
            if (updateUserBalance) {
                const success = await updateUserBalance(userId, task.reward);
                if (!success) {
                    console.warn('Centralized balance update failed, trying direct update');
                    await updateSBTBalance(userId, task.reward);
                }
            } else {
                await updateSBTBalance(userId, task.reward);
            }

            localStorage.setItem(`email_verified_${userId}`, 'true');
            if (onRewardClaimed) onRewardClaimed(task.reward);
            setShowEmailForm(prev => ({...prev, [task.id]: false}));
            toast.success(`Email Verified! +${task.reward} Smart (TON)`);
            
            // Refresh both task status and balance
            await Promise.all([
                loadTaskStatus(),
                refreshUserBalance()
            ]);
        }
        else if (isSocialTask(task.type)) {
            await handleVerificationClick(task);
        }
        
        await loadTaskStatus();
    } catch (error: any) {
        console.error('Task claim failed:', error);
        toast.error(error.message || "Task claim failed");
    } finally {
        setIsClaiming(null);
    }
  };

  // --- Derived State for UI ---
  const dailyLoginTask = tasks.find(t => t.type === 'daily_login');
  const streak = dailyLoginTask?.currentStreak || 0;
  const isCheckedIn = dailyLoginTask?.status === 'claimed';
  
  const socialTasks = tasks.filter(t => isSocialTask(t.type));
  const dailyQuests = tasks.filter(t => !isSocialTask(t.type) && t.type !== 'daily_login');

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-500" /></div>;

  return (
    <div className="flex flex-col space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Earning Center</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Complete tasks to earn Smart (TON) tokens</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 dark:border-purple-400/20 transition-all duration-300 hover:from-purple-500/20 hover:to-blue-500/20 hover:shadow-lg hover:shadow-purple-500/10">
              {isBalanceLoading ? (
                <Loader2 size={16} className="text-purple-500 dark:text-purple-400 animate-spin" />
              ) : (
                <div className="relative">
                  <Star size={16} className="text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400 drop-shadow-sm transition-all duration-300 hover:scale-110 hover:rotate-12" />
                  <div className="absolute inset-0 bg-purple-600/30 dark:bg-purple-400/30 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <span className="text-sm font-black text-purple-600 dark:text-purple-400 transition-all duration-300">
                {userBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Daily Streak Card --- */}
      {dailyLoginTask && (
        <div className="bg-slate-900 dark:bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/20 rounded-full blur-[80px] -mr-20 -mt-20" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-white/20">
                    <div className="relative">
                        <Flame size={16} className={`${isCheckedIn ? "text-green-400" : "text-amber-500"} fill-current drop-shadow-sm transition-all duration-300 hover:scale-110`} />
                        <div className={`absolute inset-0 ${isCheckedIn ? "bg-green-400/30" : "bg-amber-500/30"} rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{streak} Day Streak</span>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight">Daily Rewards</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Don't break the cycle</p>
                </div>

                <div className="flex gap-2 w-full justify-center">
                    {[1, 2, 3, 4, 5, 6, 7].map((dayOffset) => {
                        // Calculate visual days relative to current weekly cycle
                        const cycleDay = (streak % 7) || 7; 
                        // If checked in, day 1 is filled. If not, day 1 is pending.
                        const isFilled = isCheckedIn ? dayOffset <= cycleDay : dayOffset < (cycleDay + 1);
                        const isCurrent = !isCheckedIn && dayOffset === (cycleDay + 1);
                        
                        return (
                            <div key={dayOffset} className="flex flex-col items-center gap-2 flex-1 max-w-[44px]">
                                <div className={`w-full aspect-square rounded-xl flex items-center justify-center border transition-all ${
                                    isFilled
                                    ? 'bg-green-500 border-green-400 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                                    : isCurrent
                                    ? 'bg-white/5 border-white/20 animate-pulse text-white' 
                                    : 'bg-white/5 border-white/5 text-slate-600'
                                }`}>
                                    {isFilled ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-black">{dayOffset}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button 
                    onClick={() => handleClaimTask(dailyLoginTask)}
                    disabled={isCheckedIn || isClaiming === dailyLoginTask.id}
                    className={`w-full py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isCheckedIn 
                    ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed' 
                    : 'bg-green-500 text-white shadow-xl hover:bg-green-600'
                    }`}
                >
                    {isClaiming === dailyLoginTask.id ? <Loader2 className="animate-spin" size={16}/> : null}
                    {isCheckedIn ? 'Checked In Today' : 'Claim Daily Reward'}
                </button>
            </div>
        </div>
      )}

      {/* --- Daily Quests --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar size={14} className="text-slate-500 dark:text-slate-400 drop-shadow-sm transition-all duration-300 hover:scale-110 hover:text-slate-600 dark:hover:text-slate-300" />
              <div className="absolute inset-0 bg-slate-500/20 dark:bg-slate-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Daily Quests</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
           {dailyQuests.map((task) => (
             <TaskItem 
                key={task.id} 
                task={task} 
                isClaiming={isClaiming === task.id}
                onClaim={() => {
                   if (task.type === 'email_verification' && task.status !== 'claimed') {
                       setShowEmailForm(prev => ({...prev, [task.id]: !prev[task.id]}));
                   } else {
                       handleClaimTask(task);
                   }
                }} 
             >
                {/* Embedded Email Form */}
                {task.type === 'email_verification' && showEmailForm[task.id] && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="Enter your email"
                                className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-green-500"
                            />
                            <button 
                                onClick={() => handleClaimTask(task)}
                                className="bg-green-500 text-white px-4 rounded-xl font-bold text-xs hover:bg-green-600"
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                )}
             </TaskItem>
           ))}
        </div>
      </div>

      {/* --- Social Missions --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="relative">
            <TrendingUp size={14} className="text-slate-500 dark:text-slate-400 drop-shadow-sm transition-all duration-300 hover:scale-110 hover:text-slate-600 dark:hover:text-slate-300" />
            <div className="absolute inset-0 bg-slate-500/20 dark:bg-slate-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Social Missions</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
           {socialTasks.map((task) => (
             <TaskItem 
                key={task.id} 
                task={task} 
                isClaiming={isClaiming === task.id}
                onClaim={() => handleClaimTask(task)} 
             />
           ))}
        </div>
      </div>

      {/* --- Eco Banner / Partner Program --- */}
      <div className="group bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:border-slate-200 dark:hover:border-white/10 hover:-translate-y-0.5">
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
            <Gift size={64} className="text-slate-400 dark:text-slate-600" />
         </div>
         <div className="flex-1 space-y-2 relative z-10">
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Star size={14} className="text-amber-500 fill-amber-500 drop-shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                 <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Partner Program</span>
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors duration-300 group-hover:text-slate-700 dark:group-hover:text-slate-100">Eco-System Growth</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px] transition-colors duration-300 group-hover:text-slate-600 dark:group-hover:text-slate-300">
               Partner tasks are being curated by the Smart AI council. Check back soon.
            </p>
         </div>
         <div className="w-10 h-10 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 relative z-10 transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
            <div className="relative">
              <ChevronRight size={20} className="transition-all duration-300 group-hover:translate-x-0.5" />
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Sub-Component: Task Item ---
const TaskItem: React.FC<{ task: Task; onClaim: () => void; isClaiming: boolean; children?: React.ReactNode }> = ({ task, onClaim, isClaiming, children }) => {
  const isClaimed = task.status === 'claimed';
  const icon = getTaskIcon(task.type);

  return (
    <div className={`group bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-200 dark:hover:border-white/10 hover:-translate-y-0.5 ${isClaimed ? 'opacity-50' : ''}`}>
       <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border dark:border-white/5 transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                    {icon}
                </div>
                <div className="space-y-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors duration-300 group-hover:text-slate-700 dark:group-hover:text-slate-100">{task.title}</div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-green-600 dark:text-green-400 transition-colors duration-300 group-hover:text-green-700 dark:group-hover:text-green-300">+{task.reward} SMART</span>
                        <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[100px] transition-colors duration-300 group-hover:text-slate-500 dark:group-hover:text-slate-400">{task.description}</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onClaim}
                disabled={isClaimed || isClaiming}
                className={`px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 active:scale-95 flex items-center gap-2 ${
                isClaimed 
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border dark:border-white/5' 
                : 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 shadow-lg hover:shadow-xl hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-100 dark:hover:to-white transform hover:scale-105'
                }`}
            >
                {isClaiming && <Loader2 size={12} className="animate-spin"/>}
                {isClaimed ? 'Done' : task.action || 'Go'}
            </button>
       </div>
       {children}
    </div>
  );
};

export default SocialTasks;