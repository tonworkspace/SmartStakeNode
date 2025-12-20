
import React, { useState } from 'react';
import { X, ShieldCheck, ArrowUpCircle, Lock, Info } from 'lucide-react';

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStake: (amount: number) => void;
  onUnstake: (amount: number) => void;
  stakedBalance: number;
}

export const StakeModal: React.FC<StakeModalProps> = ({ 
  isOpen, 
  onClose, 
  onStake, 
  onUnstake, 
  stakedBalance 
}) => {
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState<string>('');

  if (!isOpen) return null;

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const isStake = activeTab === 'stake';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom duration-500 ease-out max-h-[92vh] flex flex-col border dark:border-white/5">
        
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />
        
        <div className="px-6 sm:px-8 pt-4 pb-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isStake ? 'Mining Stake' : 'TON Lock Status'}
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
                Network: The Open Network
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          {/* Premium Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
             <button 
                onClick={() => { setActiveTab('stake'); setAmount(''); }}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${isStake ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-500 opacity-60'}`}
             >
                ADD STAKE
             </button>
             <button 
                onClick={() => { setActiveTab('unstake'); setAmount(''); }}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${!isStake ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500 opacity-60'}`}
             >
                UNSTAKE
             </button>
          </div>

          {isStake ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-20 sm:h-24 text-3xl sm:text-4xl font-black px-6 sm:px-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent focus:border-slate-100 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700 tabular-nums text-green-600 dark:text-green-400"
                  />
                  <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-xs pointer-events-none">TON</div>
                </div>

                <div className="flex justify-between px-2">
                   <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">External Wallet</span>
                   <span className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">~ 1,240.50 TON</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      className="py-3 rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-all active:scale-95"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const val = parseFloat(amount);
                  if (val > 0) {
                    onStake(val);
                    onClose();
                  }
                }}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-4 sm:py-5 rounded-[24px] bg-green-500 hover:bg-green-600 text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-2xl shadow-green-100 dark:shadow-none transition-all transform active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-30"
              >
                <ArrowUpCircle size={18} />
                Confirm Mining Stake
              </button>
            </div>
          ) : (
            <div className="space-y-6 py-4 animate-in fade-in duration-300 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                <Lock size={32} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-slate-900 dark:text-white font-black text-lg">Your Assets are Locked</h4>
                 <p className="text-slate-400 dark:text-slate-500 text-xs font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-wider">
                    To maintain network security and mining stability, staked TON is locked during the Genesis Phase.
                 </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex gap-3 text-left">
                 <Info className="text-amber-500" size={18} />
                 <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase leading-relaxed tracking-widest">
                    Withdrawal of staked assets will open after the SMART token public launch (Phase 2).
                 </p>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* Security Footer */}
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
               <ShieldCheck className="text-green-500" size={18} />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed font-bold uppercase tracking-wider text-left">
              Secure TON Mining Protocol v1.0. All staking transactions are finalized on the immutable ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
