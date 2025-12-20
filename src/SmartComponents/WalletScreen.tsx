
import React, { useState } from 'react';
import { 
  Wallet, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  History, 
  Banknote, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCircle2, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { ActivityRecord, MarketData } from '@/pages/IndexPage/IndexPage';
import { toast } from 'react-hot-toast';
import { useWallet } from '@/contexts/WalletContext';

interface WalletScreenProps {
  address?: string;
  claimedAmount: number;
  stakedAmount: number;
  tonBalance: number;
  activities: ActivityRecord[];
  onWithdrawSmart: (amount: number) => void;
  onWithdrawTon: (amount: number) => void;
  onConvertSmartToTon: (amount: number) => void;
  marketData: MarketData;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  address,
  claimedAmount,
  stakedAmount,
  tonBalance,
  activities,
  onWithdrawSmart,
  onWithdrawTon,
  onConvertSmartToTon,
  marketData
}) => {
  const { connectedAddressString } = useWallet();
  const [smartMode, setSmartMode] = useState<'convert' | 'withdraw'>('convert');
  const [smartInput, setSmartInput] = useState('');
  const [tonInput, setTonInput] = useState('');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

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

  const smartUsd = claimedAmount * marketData.smartPrice;
  const tonLiquidUsd = tonBalance * marketData.tonPrice;
  const tonLockedUsd = stakedAmount * marketData.tonPrice;
  const totalUsd = smartUsd + tonLiquidUsd + tonLockedUsd;

  const estimatedTonFromSmart = (parseFloat(smartInput) || 0) * (marketData.smartPrice / marketData.tonPrice);

  const handleSmartAction = () => {
    const val = parseFloat(smartInput);
    if (isNaN(val) || val <= 0) return;
    if (smartMode === 'convert') {
      onConvertSmartToTon(val);
    } else {
      onWithdrawSmart(val);
    }
    setSmartInput('');
  };

  const handleTonWithdraw = () => {
    const val = parseFloat(tonInput);
    if (isNaN(val) || val <= 0) return;
    onWithdrawTon(val);
    setTonInput('');
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Copied to clipboard!", { icon: '📋' });
  };

  const toggleExpand = (id: string) => {
    setExpandedTx(expandedTx === id ? null : id);
  };

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-500 pb-10">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Assets Hub</h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">Manage and move your earnings</p>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">Net Worth</span>
          <div className="text-slate-900 dark:text-white font-black text-lg sm:text-xl tabular-nums leading-none">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* SMART AI MANAGEMENT CARD */}
      <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-[32px] text-white space-y-6 shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-green-500/20 transition-all duration-700" />
        
        <div className="space-y-2 relative z-10">
           <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SmartAI Pool</h3>
              <div className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-lg text-[8px] font-black uppercase">Liquid Profit</div>
           </div>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{claimedAmount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
              <span className="text-green-500 font-bold text-sm">SMART</span>
           </div>
           <div className="text-[10px] font-bold text-slate-500">≈ ${smartUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
        </div>

        <div className="relative z-10 flex p-1 bg-white/5 rounded-2xl border border-white/5">
           <button 
             onClick={() => setSmartMode('convert')}
             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${smartMode === 'convert' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
           >
             <RefreshCw size={12} className={smartMode === 'convert' ? 'animate-spin-slow' : ''} />
             To TON
           </button>
           <button 
             onClick={() => setSmartMode('withdraw')}
             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${smartMode === 'withdraw' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
           >
             <Send size={12} />
             Withdraw
           </button>
        </div>

        <div className="relative z-10 space-y-4">
           <div className="bg-white/5 rounded-[24px] p-4 border border-white/10 space-y-3">
              <input 
                type="number" 
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder="0.00 SMART" 
                className="w-full bg-transparent text-2xl font-black outline-none placeholder:text-white/10"
              />
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {smartMode === 'convert' ? `Est. Recieve: ${estimatedTonFromSmart.toFixed(4)} TON` : 'Send to Primary Wallet'}
                 </span>
                 <button onClick={() => setSmartInput(claimedAmount.toString())} className="text-[9px] font-black text-green-500 uppercase tracking-widest">MAX</button>
              </div>
           </div>

           {smartMode === 'withdraw' && (
              <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="text-green-400" size={14} />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination Address</span>
                </div>
                <div className="text-[9px] font-black text-white bg-slate-800 px-2 py-1 rounded-lg border border-white/5">
                   {connectedAddressString || address || 'Not connected'}
                </div>
              </div>
           )}

           <button 
             onClick={handleSmartAction}
             disabled={!smartInput || parseFloat(smartInput) <= 0 || parseFloat(smartInput) > claimedAmount}
             className="w-full py-4 bg-white text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
           >
             {smartMode === 'convert' ? 'Swap to TON Balance' : 'Confirm Withdrawal'}
             <ArrowRight size={14} />
           </button>
        </div>
      </div>

      {/* AVAILABLE TON MANAGEMENT CARD */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <Banknote size={20} />
             </div>
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available TON</h3>
                <div className="text-xl font-black text-slate-900 dark:text-white">{tonBalance.toFixed(4)} <span className="text-xs font-bold opacity-40">TON</span></div>
             </div>
           </div>
           <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">Liquid</div>
              <div className="text-[9px] font-black text-green-500">≈ ${tonLiquidUsd.toFixed(2)}</div>
           </div>
        </div>

        <div className="space-y-4">
           <div className="flex flex-col gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/10 px-4 py-3 flex items-center">
                <input 
                  type="number"
                  value={tonInput}
                  onChange={(e) => setTonInput(e.target.value)}
                  placeholder="Withdraw amount..."
                  className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none w-full"
                />
                <button onClick={() => setTonInput(tonBalance.toString())} className="text-[9px] font-black text-blue-500 uppercase ml-2">MAX</button>
              </div>

              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Wallet size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Main Wallet:</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-900 dark:text-slate-200">{connectedAddressString || address || 'Not connected'}</span>
              </div>

              <button 
                onClick={handleTonWithdraw}
                disabled={!tonInput || parseFloat(tonInput) <= 0 || parseFloat(tonInput) > tonBalance}
                className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-20"
              >
                Withdraw TON
              </button>
           </div>
        </div>
      </div>

      {/* DETAILED TRANSACTION LOG */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] sm:text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">History Detail</h3>
          <button className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">Protocol <ShieldAlert size={10} /></button>
        </div>

        <div className="space-y-3 min-h-[100px]">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div 
                key={act.id} 
                className={`bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm transition-all overflow-hidden ${expandedTx === act.id ? 'ring-1 ring-slate-200 dark:ring-white/10' : ''}`}
              >
                <div 
                  onClick={() => toggleExpand(act.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                      act.type === 'convert_smart' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 
                      act.type === 'claim' ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 
                      'bg-slate-50 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {act.type === 'convert_smart' ? <RefreshCw size={16} /> : act.type === 'withdraw_ton' ? <Banknote size={16} /> : act.type === 'withdraw_smart' ? <Send size={16} /> : <History size={16} />}
                    </div>
                    <div>
                      <div className="text-slate-800 dark:text-slate-200 text-[11px] font-black uppercase tracking-tight">
                        {act.type === 'convert_smart' ? 'Auto-Swap' : act.type === 'withdraw_ton' ? 'TON Payout' : act.type === 'claim' ? 'Reward' : act.type === 'stake' ? 'Staking' : 'SMART Payout'}
                      </div>
                      <div className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-wider">{formatTime(act.timestamp)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-[12px] font-black tabular-nums ${
                        act.type === 'claim' ? 'text-green-600' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {['stake', 'withdraw_ton', 'withdraw_smart', 'convert_smart'].includes(act.type) ? '-' : '+'}{act.amount.toFixed(act.token === 'TON' ? 2 : 4)} {act.token}
                      </div>
                    </div>
                    {expandedTx === act.id ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                  </div>
                </div>

                {expandedTx === act.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={10} /> Confirmed
                        </div>
                      </div>

                      {act.recipient && (
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient Wallet</span>
                          <button 
                            onClick={() => copyHash(act.recipient!)}
                            className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-white/10"
                          >
                            {act.recipient} <Copy size={10} />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction Hash</span>
                        <button 
                          onClick={() => copyHash(act.txHash)}
                          className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-white/10"
                        >
                          {act.txHash.slice(0, 8)}... <Copy size={10} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          <Clock size={10} className="text-slate-300" /> {getFullTime(act.timestamp)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Value at Tx</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">
                          ${(act.amount * (act.token === 'SMART' ? marketData.smartPrice : marketData.tonPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No transactions recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
