import { Zap, TrendingUp, Activity, ChevronRight, Sparkles, Lock, Clock, ArrowUpRight, ArrowDownRight, Gift, Coins } from 'lucide-react';

interface ArcadeMiningUIProps {
  balanceTon: number;
  tonPrice: number;
  currentEarningsTon: number;
  isClaiming: boolean;
  claimCooldown: number;
  cooldownText: string;
  onClaim: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw?: () => void;
  airdropBalanceNova: number;
  potentialEarningsTon: number;
  totalWithdrawnTon: number;
  activities?: any[];
  withdrawals?: any[];
  isLoadingActivities?: boolean;
  userId?: number;
  userUsername?: string;
  referralCode?: string;
  estimatedDailyTapps?: number;
  showSnackbar?: (data: { message: string; description?: string }) => void;
}

export default function ArcadeMiningUI(props: ArcadeMiningUIProps) {
  const {
    balanceTon,
    tonPrice,
    currentEarningsTon,
    isClaiming,
    claimCooldown,
    cooldownText,
    onClaim,
    onOpenDeposit,
    totalWithdrawnTon,
    estimatedDailyTapps
  } = props;

  const isMining = balanceTon > 0;
  
  // Calculate display values
  // "Total Mined" includes both claimed and currently pending earnings
  const totalMined = totalWithdrawnTon + currentEarningsTon;
  const usdValue = (totalMined * tonPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Estimate hourly rate based on daily estimate
  const hourlyRate = estimatedDailyTapps ? (estimatedDailyTapps / 24) : 0;
  const hourlyUsd = hourlyRate * tonPrice;

  return (
    <div className="flex flex-col items-center space-y-6 sm:space-y-8 animate-in fade-in duration-700 w-full max-w-md mx-auto p-4">
      {/* Dynamic Counter */}
      <div className="text-center space-y-2 mt-2 sm:mt-4">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
          Total Mined TON
        </span>
        <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
          <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
            {totalMined.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
          </span>
          <span className="text-lg sm:text-xl font-bold text-blue-500">TON</span>
        </div>
        
        <div className="text-slate-400 dark:text-slate-500 font-bold text-sm sm:text-base animate-pulse">
           ≈ ${usdValue} USD
        </div>

        {isMining && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 px-4 py-1.5 rounded-full w-fit mx-auto mt-3 border border-blue-100/30 dark:border-blue-500/20 shadow-sm animate-in zoom-in duration-300 backdrop-blur-sm">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-[9px] font-black uppercase tracking-wider opacity-80">
                  {hourlyRate.toFixed(4)} TON/hr
                </span>
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  ≈ ${hourlyUsd.toFixed(4)} USD/hr
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Action Hub */}
      <div className="relative">
        {isMining && (
          <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse scale-110 pointer-events-none" />
        )}
        <button
          onClick={onOpenDeposit}
          className={`relative z-10 w-48 h-48 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center transition-all duration-700 transform active:scale-95 ${
            isMining 
            ? 'bg-slate-900 dark:bg-slate-800 border-[6px] sm:border-[8px] border-white dark:border-slate-700 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]' 
            : 'bg-white dark:bg-slate-900 border-[6px] sm:border-[8px] border-slate-50 dark:border-white/5 text-slate-200 dark:text-slate-700 shadow-xl shadow-slate-100 dark:shadow-none hover:border-blue-100 dark:hover:border-blue-500/30 hover:text-blue-400'
          }`}
        >
          <Zap 
            size={56} 
            fill={isMining ? "white" : "none"} 
            className={`mb-1 sm:mb-2 transition-all duration-500 sm:size-[72px] ${isMining ? 'text-blue-400 scale-110' : 'text-slate-300 dark:text-slate-800'}`} 
          />
          <span className={`font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] ${isMining ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`}>
            {isMining ? 'Mining Active' : 'Start Mining'}
          </span>
          {isMining && (
             <div className="mt-3 sm:mt-4 px-2 sm:px-3 py-1 bg-white/10 rounded-full text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-white/5 backdrop-blur-sm">
               Verified Node
             </div>
          )}
        </button>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-500/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700">
             <Lock size={12} />
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors z-10">
            <Activity size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1 z-10">Locked TON</span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg z-10">{balanceTon.toFixed(2)}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase z-10">Active Stake</span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-500/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors z-10">
            <TrendingUp size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1 z-10">Daily Yield</span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">~3.06%</span>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest z-10">Boost Active</span>
        </div>
      </div>

      {/* Harvest Button */}
      {currentEarningsTon > 0 && (
        <div className="w-full animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={onClaim}
            disabled={isClaiming || claimCooldown > 0}
            className={`w-full relative overflow-hidden group rounded-[28px] sm:rounded-[32px] p-[1px] shadow-2xl transition-all active:scale-[0.97] ${
                isClaiming || claimCooldown > 0 
                ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed opacity-70' 
                : 'bg-slate-900 dark:bg-slate-800 text-white'
            }`}
          >
            {!(isClaiming || claimCooldown > 0) && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}
            
            <div className={`relative rounded-[27px] sm:rounded-[31px] py-4 sm:py-5 flex items-center justify-center gap-3 transition-colors duration-300 ${
                isClaiming || claimCooldown > 0 ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-900 dark:bg-slate-800 group-hover:bg-transparent'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isClaiming ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-500/10 text-blue-400 group-hover:bg-white group-hover:text-blue-600'
              }`}>
                {isClaiming ? (
                    <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Sparkles size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                )}
              </div>
              
              <div className="flex flex-col items-start text-left">
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${
                    isClaiming || claimCooldown > 0 ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-white/80'
                }`}>
                    {claimCooldown > 0 ? `Cooldown ${cooldownText}` : 'Pending Rewards'}
                </span>
                <span className={`text-xs sm:text-sm font-black uppercase tracking-widest ${
                    isClaiming || claimCooldown > 0 ? 'text-slate-500' : 'text-white'
                }`}>
                  Harvest {currentEarningsTon.toFixed(4)} TON
                </span>
              </div>
              
              {!(isClaiming || claimCooldown > 0) && (
                  <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform opacity-40 group-hover:opacity-100 text-white" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Recent Activities */}
      {props.activities && props.activities.length > 0 && (
        <div className="w-full space-y-3 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] uppercase font-black tracking-[0.3em]">
              Recent Activity
            </h3>
            <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600">
              <Clock size={10} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {props.activities.slice(0, 3).map((activity, index) => (
              <ActivityItem key={activity.id || index} activity={activity} />
            ))}
          </div>
          
          {props.activities.length > 3 && (
            <div className="text-center pt-2">
              <span className="text-[8px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
                +{props.activities.length - 3} more activities
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Activity Item Component
const ActivityItem: React.FC<{ activity: any }> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'top_up':
      case 'stake':
        return <ArrowDownRight size={12} className="text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight size={12} className="text-red-500" />;
      case 'claim':
      case 'reward':
      case 'earnings_update':
        return <Sparkles size={12} className="text-blue-500" />;
      case 'nova_reward':
      case 'nova_income':
      case 'bonus':
        return <Gift size={12} className="text-purple-500" />;
      default:
        return <Coins size={12} className="text-slate-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'top_up':
      case 'stake':
        return 'text-green-500';
      case 'withdrawal':
        return 'text-red-500';
      case 'claim':
      case 'reward':
      case 'earnings_update':
        return 'text-blue-500';
      case 'nova_reward':
      case 'nova_income':
      case 'bonus':
        return 'text-purple-500';
      default:
        return 'text-slate-400';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'top_up':
        return 'Top Up';
      case 'withdrawal':
        return 'Withdrawal';
      case 'stake':
        return 'Stake';
      case 'claim':
        return 'Claimed';
      case 'reward':
        return 'Reward';
      case 'earnings_update':
        return 'Earnings';
      case 'nova_reward':
        return 'Nova Reward';
      case 'nova_income':
        return 'Nova Income';
      case 'bonus':
        return 'Bonus';
      default:
        return 'Activity';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-[20px] border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        {getActivityIcon(activity.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {getActivityLabel(activity.type)}
          </span>
          <span className={`text-[10px] font-bold ${getActivityColor(activity.type)}`}>
            {activity.amount > 0 ? '+' : ''}{Number(activity.amount).toFixed(4)} TON
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[8px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest">
            {activity.status || 'Completed'}
          </span>
          <span className="text-[8px] text-slate-400 dark:text-slate-600 font-medium">
            {formatTime(activity.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}