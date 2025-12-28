import React, { useState, useEffect } from 'react';
import { Cpu, Database } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Secure Vault...');
  const [dataStream, setDataStream] = useState<string[]>([]);

  const statuses = [
    'Initializing Neural Interface...',
    'Connecting to TON Genesis...',
    'Fetching Block Headers...',
    'Verifying Stake Proofs...',
    'Syncing Distributed Ledger...',
    'Preparing Dashboard...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.8, 100));
    }, 20);

    const statusInterval = setInterval(() => {
      setStatus(prev => {
        const nextIdx = (statuses.indexOf(prev) + 1) % statuses.length;
        return statuses[nextIdx];
      });
    }, 400);

    const streamInterval = setInterval(() => {
      const hex = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
      setDataStream(prev => [hex, ...prev].slice(0, 15));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
      clearInterval(streamInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Matrix Data Stream Background */}
      <div className="absolute inset-0 opacity-[0.03] flex justify-around pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="text-[10px] font-mono text-green-500 flex flex-col gap-1 animate-in slide-in-from-top duration-1000">
            {dataStream.map((d, j) => (
              <span key={j} style={{ opacity: 1 - (j * 0.1) }}>
                {d}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Central Visuals */}
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping scale-[2] blur-3xl" />
        <div className="absolute inset-0 rounded-full border border-green-500/10 animate-pulse-ring" />
        <div className="w-28 h-28 bg-slate-900 border-2 border-green-500/50 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-[0_0_80px_rgba(34,197,94,0.3)] relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-transparent" />
          <span className="relative z-10 animate-pulse">S</span>
          {/* Scanning Beam */}
          <div className="absolute inset-x-0 h-[2px] bg-green-400/50 shadow-[0_0_10px_#4ade80] animate-scan" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-8 text-center relative z-20">
        <div className="space-y-3">
          <h2 className="text-white font-black text-2xl tracking-tighter uppercase">Initializing Node</h2>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Cpu size={14} className="animate-spin-slow text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] min-w-[180px]">
              {status}
            </span>
          </div>
        </div>

        {/* Futuristic Progress Bar */}
        <div className="space-y-4">
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 px-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-green-600 via-green-400 to-green-300 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">
            <span className="flex items-center gap-1">
              <Database size={10} /> TON-NETWORK_v1.4
            </span>
            <span className="tabular-nums">{Math.floor(progress)}% COMPLETE</span>
          </div>
        </div>
      </div>
    </div>
  );
};