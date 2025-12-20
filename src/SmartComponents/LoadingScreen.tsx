
import React, { useState, useEffect } from 'react';
import { Shield, Cpu, Globe, Zap } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Secure Vault...');

  const statuses = [
    'Initializing Secure Vault...',
    'Connecting to TON RPC...',
    'Syncing Ledger State...',
    'Verifying AI Node...',
    'Calculating Offline Yield...',
    'Preparing Dashboard...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 20);

    const statusInterval = setInterval(() => {
      setStatus(prev => {
        const nextIdx = (statuses.indexOf(prev) + 1) % statuses.length;
        return statuses[nextIdx];
      });
    }, 450);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-8">
      {/* Animated Network Ring */}
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping scale-150 blur-2xl" />
        <div className="absolute inset-0 rounded-full border border-green-500/20 animate-pulse-ring" />
        <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-[0_0_50px_rgba(34,197,94,0.4)] relative z-10">
          S
        </div>
      </div>

      <div className="w-full max-w-xs space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-white font-black text-xl tracking-tight">Smart Stake AI</h2>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Cpu size={14} className="animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{status}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
            <span>Blockchain Sync</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-12 flex gap-6 opacity-20">
         <Shield className="text-white" size={20} />
         <Globe className="text-white" size={20} />
         <Zap className="text-white" size={20} />
      </div>
    </div>
  );
};
