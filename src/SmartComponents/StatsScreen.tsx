
import React from 'react';
import { Globe, Users, Zap, BarChart3, Info } from 'lucide-react';

export const StatsScreen: React.FC = () => {
  return (
    <div className="flex flex-col space-y-8 animate-in slide-in-from-right duration-500">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Global Stats</h2>
        <p className="text-slate-400 text-sm font-medium">Real-time network performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <Globe className="text-blue-500 mb-4" size={24} />
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total TVL</div>
          <div className="text-slate-900 font-black text-xl">4.2M TON</div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <Users className="text-purple-500 mb-4" size={24} />
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Active Miners</div>
          <div className="text-slate-900 font-black text-xl">124.8K</div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <Zap className="text-amber-500 mb-4" size={24} />
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Hash Rate</div>
          <div className="text-slate-900 font-black text-xl">842 TH/s</div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <BarChart3 className="text-green-500 mb-4" size={24} />
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Daily Yield</div>
          <div className="text-slate-900 font-black text-xl">14.2K S</div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
            <Info className="text-green-400" size={24} />
          </div>
          <h3 className="font-bold text-lg leading-tight">Protocol Safety</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-[200px]">
            SmartStake AI uses advanced TON smart contracts audited by open source security firms.
          </p>
        </div>
      </div>
    </div>
  );
};
