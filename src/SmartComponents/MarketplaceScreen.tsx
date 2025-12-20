
import React from 'react';
import { Zap, ShieldCheck, Crown, ShoppingBag, ArrowUpCircle, Sparkles, Calculator, TrendingUp } from 'lucide-react';

interface MarketplaceScreenProps {
  claimedBalance: number;
  onPurchase: (cost: number, boost: number, label: string) => void;
  currentBoost: number;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ claimedBalance, onPurchase, currentBoost }) => {
  const APY = 0.15; // Updated to 15% base APY
  
  const items = [
    {
      id: 'turbo',
      name: 'Mining Turbo',
      description: 'Increases base mining speed by 25% permanently.',
      cost: 10,
      boost: 0.25,
      icon: <Zap className="text-amber-500" size={24} />,
      color: 'bg-amber-50 dark:bg-amber-500/10'
    },
    {
      id: 'diamond',
      name: 'Diamond Access',
      description: 'Increases withdrawal priority & unlock limit.',
      cost: 25,
      boost: 0.1,
      icon: <Crown className="text-purple-500" size={24} />,
      color: 'bg-purple-50 dark:bg-purple-500/10'
    },
    {
      id: 'shield',
      name: 'Vault Plus',
      description: 'Adds an extra layer of AI verification and security.',
      cost: 5,
      boost: 0.05,
      icon: <ShieldCheck className="text-blue-500" size={24} />,
      color: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      id: 'quantum',
      name: 'Quantum Node',
      description: 'Advanced mining node with +100% boost capability.',
      cost: 100,
      boost: 1.0,
      icon: <Sparkles className="text-green-500" size={24} />,
      color: 'bg-green-50 dark:bg-green-500/10'
    }
  ];

  const calculateYield = (tonAmount: number) => {
    const dailyBase = (tonAmount * APY) / 365;
    const dailyWithBoost = dailyBase * currentBoost;
    return {
      daily: dailyWithBoost.toFixed(4),
      monthly: (dailyWithBoost * 30.44).toFixed(2)
    };
  };

  const projections = [10, 100, 1000];

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Marketplace</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Upgrade your mining operation</p>
        </div>
        <div className="bg-slate-900 dark:bg-slate-800 px-4 py-2 rounded-2xl flex flex-col items-end border dark:border-white/5">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Your SMART</span>
          <span className="text-white font-black text-sm tabular-nums">{claimedBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Boost Info Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-bold text-sm">Active Multiplier</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-wider">Current Boost</div>
          </div>
        </div>
        <div className="text-green-600 dark:text-green-400 font-black text-xl">x{currentBoost.toFixed(2)}</div>
      </div>

      {/* Yield Calculator Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Calculator size={14} className="text-slate-400 dark:text-slate-600" />
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Earning Projections</h3>
        </div>
        <div className="bg-slate-900 dark:bg-slate-900/50 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group border dark:border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-green-500/20 transition-all duration-700" />
          
          <div className="space-y-4 relative z-10">
            {projections.map((ton) => {
              const { daily, monthly } = calculateYield(ton);
              return (
                <div key={ton} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-300">If you stake</div>
                      <div className="text-sm font-black text-white">{ton} TON</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-black text-sm">+{daily} SMART/day</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">~{monthly} Monthly</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5">
             <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
               *Calculations based on 15% APY and your current {currentBoost}x boost. Rates are dynamic based on network volume.
             </p>
          </div>
        </div>
      </div>

      {/* Upgrades List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ShoppingBag size={14} className="text-slate-400 dark:text-slate-600" />
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Available Upgrades</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-200 dark:hover:border-green-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">{item.name}</div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs leading-relaxed max-w-[200px]">{item.description}</p>
                </div>
              </div>
              
              <button 
                onClick={() => onPurchase(item.cost, item.boost, item.name)}
                disabled={claimedBalance < item.cost}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100 ${
                  claimedBalance >= item.cost 
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-lg shadow-slate-200 dark:shadow-none' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-white/5'
                }`}
              >
                {item.cost} SMART
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/5 dark:bg-white/5 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 border-dashed flex items-center gap-4">
        <Sparkles className="text-slate-300 dark:text-slate-700" size={24} />
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium leading-relaxed">
          More items and NFTs coming soon. Upgrades are permanently tied to your connected TON wallet address and the Open Network.
        </p>
      </div>
    </div>
  );
};
