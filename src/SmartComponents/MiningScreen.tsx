
import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Activity, ChevronRight, Sparkles, Lock, Shield } from 'lucide-react';
import { StakeModal } from './StakeModal';
import { MarketData } from '@/pages/IndexPage/IndexPage';
import { useWallet } from '@/contexts/WalletContext';

interface MiningScreenProps {
  stakedAmount: number;
  claimedAmount: number;
  startTime: number | null;
  boostMultiplier: number;
  onStake: (amount: number) => void;
  onUnstake: (amount: number) => void;
  onClaim: (amount: number) => void;
  marketData: MarketData;
}

export const MiningScreen: React.FC<MiningScreenProps> = ({
  stakedAmount,
  claimedAmount,
  startTime,
  boostMultiplier,
  onStake,
  onUnstake,
  onClaim,
  marketData
}) => {
  const { connectedAddressString } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [minedSession, setMinedSession] = useState<number>(0);
  
  // Updated APY to 15%
  const APY = 0.15;
  const RATE_PER_SEC = ((stakedAmount * APY) / (365 * 24 * 60 * 60)) * boostMultiplier;

  useEffect(() => {
    if (!startTime || stakedAmount <= 0) {
      setMinedSession(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setMinedSession(elapsedSeconds * RATE_PER_SEC);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, stakedAmount, RATE_PER_SEC]);

  const isMining = stakedAmount > 0;
  const totalMined = claimedAmount + minedSession;
  const miningRateHr = (RATE_PER_SEC * 3600).toFixed(6);
  const usdValue = (totalMined * marketData.smartPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usdRateHr = (parseFloat(miningRateHr) * marketData.smartPrice).toFixed(4);

  return (
    <div className="flex flex-col items-center space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Protocol Dashboard Header */}
      <div className="w-full space-y-2 text-center">
        <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Protocol Yield Terminal</h2>
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
            isMining
            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 shadow-sm'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
             <Shield size={12} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">
               {isMining ? 'Secure Session Active' : 'Protocol Inactive'}
             </span>
          </div>
          {connectedAddressString && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-full text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase shadow-sm">
              <Shield size={10} className="text-green-500" />
              {connectedAddressString.slice(0, 6)}...{connectedAddressString.slice(-4)}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Counter */}
      <div className="text-center space-y-2 mt-2 sm:mt-4">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">Total Mined SMART</span>
        <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
          <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
            {totalMined.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
          </span>
          <span className="text-lg sm:text-xl font-bold text-green-500">SMART</span>
        </div>
        
        <div className="text-slate-400 dark:text-slate-500 font-bold text-sm sm:text-base animate-pulse">
           ≈ ${usdValue} USD
        </div>

        {isMining && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-500/10 px-4 py-1.5 rounded-full w-fit mx-auto mt-3 border border-green-100/30 dark:border-green-500/20 shadow-sm animate-in zoom-in duration-300 backdrop-blur-sm">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{miningRateHr} S/hr</span>
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">≈ ${usdRateHr} USD/hr</span>
              </div>
            </div>
            {boostMultiplier > 1 && (
              <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse mt-1">
                Boost x{boostMultiplier.toFixed(2)} Active
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Action Hub */}
      <div className="relative">
        {isMining && (
          <div className="absolute inset-0 rounded-full bg-green-400/10 animate-pulse-ring scale-125 pointer-events-none" />
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`relative z-10 w-48 h-48 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center transition-all duration-700 transform active:scale-90 ${
            isMining 
            ? 'bg-slate-900 dark:bg-slate-800 border-[6px] sm:border-[8px] border-white dark:border-slate-700 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]' 
            : 'bg-white dark:bg-slate-900 border-[6px] sm:border-[8px] border-slate-50 dark:border-white/5 text-slate-200 dark:text-slate-700 shadow-xl shadow-slate-100 dark:shadow-none hover:border-green-100 dark:hover:border-green-500/30 hover:text-green-400'
          }`}
        >
          <Zap size={56} fill={isMining ? "white" : "none"} className={`mb-1 sm:mb-2 transition-all duration-500 sm:size-[72px] ${isMining ? 'text-green-400 scale-110' : 'text-slate-100 dark:text-slate-800'}`} />
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
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform relative">
          <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700">
             <Lock size={12} />
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
            <Activity size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">Locked TON</span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">{stakedAmount}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">Phase 1 Locked</span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center group transition-transform">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2 sm:mb-4 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
            <TrendingUp size={18} className="sm:size-5" />
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[8px] sm:text-[9px] uppercase font-black tracking-widest mb-1">Yield Rate</span>
          <span className="text-slate-900 dark:text-white font-black text-base sm:text-lg">15.0%</span>
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Fixed APY</span>
        </div>
      </div>

      {/* Harvest Button (Moves to App Balance) */}
      {minedSession > 0 && (
        <div className="w-full animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => onClaim(minedSession)}
            className="w-full relative overflow-hidden group bg-slate-900 dark:bg-slate-800 text-white rounded-[28px] sm:rounded-[32px] p-[1px] shadow-2xl transition-all active:scale-[0.97]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-slate-900 dark:bg-slate-800 group-hover:bg-transparent rounded-[27px] sm:rounded-[31px] py-4 sm:py-5 flex items-center justify-center gap-3 transition-colors duration-300">
              <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 group-hover:bg-white group-hover:text-green-600 transition-all">
                <Sparkles size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-slate-400 dark:text-slate-500 group-hover:text-white/80">Pending Rewards</span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">Harvest {minedSession.toFixed(4)} SMART</span>
              </div>
              <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform opacity-40 group-hover:opacity-100" />
            </div>
          </button>
        </div>
      )}

      <StakeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onStake={onStake} 
        onUnstake={onUnstake}
        stakedBalance={stakedAmount}
      />
    </div>
  );
};
