
import React, { useState } from 'react';
import { ArrowDown, Info, ChevronDown, Repeat, Lock, Sparkles, Globe } from 'lucide-react';
import { MarketData } from '@/pages/IndexPage/IndexPage';

interface SwapScreenProps {
  claimedBalance: number;
  marketData: MarketData;
}

export const SwapScreen: React.FC<SwapScreenProps> = ({ claimedBalance, marketData }) => {
  const [amount, setAmount] = useState<string>('');
  const [targetToken] = useState<'USDT' | 'TON' | 'BTC'>('USDT');

  const getEstimatedValue = () => {
    const val = parseFloat(amount) || 0;
    const usdVal = val * marketData.smartPrice;
    
    if (targetToken === 'USDT') return usdVal.toFixed(2);
    if (targetToken === 'TON') return (usdVal / marketData.tonPrice).toFixed(4);
    if (targetToken === 'BTC') return (usdVal / 95000).toFixed(8); // Mock BTC price
    return '0.00';
  };

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Token Exchange</h2>
        <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Swap SMART for major crypto assets</p>
      </div>

      {/* Main Swap Card */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden">
        {/* Launching Soon Overlay */}
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center space-y-4">
           <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-2xl animate-bounce border dark:border-white/10">
              <Lock size={32} />
           </div>
           <div className="space-y-1">
             <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Launching Soon</h3>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
               Liquidity Pools are being initialized. Trading will open after Phase 1 mining concludes.
             </p>
           </div>
           <div className="flex gap-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-[9px] font-black uppercase">Phase 1: Active</div>
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-full text-[9px] font-black uppercase">Swap: Pending</div>
           </div>
        </div>

        <div className="space-y-4">
          {/* Input Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[24px] border border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">You Sell</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">Balance: {claimedBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl font-black text-slate-900 dark:text-white outline-none w-1/2"
              />
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                 <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">S</div>
                 <span className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase">SMART</span>
              </div>
            </div>
          </div>

          {/* Divider Icon */}
          <div className="flex justify-center -my-6 relative z-10">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-600 shadow-md">
              <ArrowDown size={18} />
            </div>
          </div>

          {/* Output Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[24px] border border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">You Get (Est.)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-slate-300 dark:text-slate-700">{getEstimatedValue()}</span>
              <button 
                className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                 <span className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase">{targetToken}</span>
                 <ChevronDown size={14} className="text-slate-400 dark:text-slate-600" />
              </button>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="px-2 space-y-2">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                <span>Exchange Rate</span>
                <span className="text-slate-900 dark:text-slate-200">1 SMART = ${marketData.smartPrice}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                <span>Slippage Tolerance</span>
                <span className="text-slate-900 dark:text-slate-200">0.5%</span>
             </div>
          </div>

          <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] cursor-not-allowed">
             Exchange Locked
          </button>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Globe size={14} className="text-slate-400 dark:text-slate-600" />
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Open Network Roadmap</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm flex items-start gap-4">
             <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={20} />
             </div>
             <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-2">Phase 1: Genesis Mining</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                  Current Stage. Users mine SmartAI tokens via TON staking to build the initial ecosystem volume.
                </p>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm flex items-start gap-4 opacity-60">
             <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <Repeat size={20} />
             </div>
             <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-2">Phase 2: DEX Listing</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                  Liquidity provision on major TON DEXs (Ston.fi, DeDust) for instant SMART/USDT swapping.
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-[32px] flex items-center gap-4 border border-white/5 shadow-2xl">
        <Info className="text-green-500 shrink-0" size={24} />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed italic">
          SmartAI is natively built for The Open Network. Your mined balance is safe and stored on the immutable ledger until the swap gateway opens.
        </p>
      </div>
    </div>
  );
};
