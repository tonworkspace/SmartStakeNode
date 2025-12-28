
import React, { useState } from 'react';
import { Wallet, ShieldCheck, Zap, Cpu, Fingerprint, Check } from 'lucide-react';
import { LegalModals } from './LegalModals';

interface AuthScreenProps {
  onConnect: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  const handleConnect = () => {
    if (!agreedTerms || !agreedPrivacy) return;
    setIsConnecting(true);
    setTimeout(() => {
      onConnect();
    }, 2000);
  };

  if (isConnecting) {
    return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700 max-w-sm mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping scale-150 blur-2xl" />
          <div className="w-24 h-24 bg-slate-900 dark:bg-white rounded-[32px] flex items-center justify-center text-white dark:text-slate-900 shadow-2xl relative z-10">
            <Fingerprint size={48} className="animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Establishing Secure Link</h2>
          <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] animate-pulse">Syncing with TON Genesis Node...</p>
        </div>
        <div className="w-48 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-12 px-6 animate-in fade-in zoom-in duration-700 max-w-sm mx-auto h-full">
      <LegalModals 
        isOpen={modalType !== null} 
        type={modalType || 'terms'} 
        onClose={() => setModalType(null)} 
      />

      <div className="w-full text-center space-y-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500/20 rounded-[40px] blur-3xl scale-150 animate-pulse" />
          <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[36px] shadow-2xl flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 relative z-10">
            <Cpu size={48} className="text-green-500" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            SMART <span className="text-green-500">STAKE</span> AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed px-4">
            Secure node protocol on <span className="text-slate-900 dark:text-white font-bold">The Open Network</span>.
          </p>
        </div>
      </div>

      <div className="w-full space-y-3 my-8">
        <FeaturePill 
          icon={<Zap size={18} className="text-amber-500" />} 
          title="15% APY Staking" 
          desc="Real-time rewards." 
        />
        <FeaturePill 
          icon={<ShieldCheck size={18} className="text-blue-500" />} 
          title="Cloud Protected" 
          desc="Encrypted vault sync." 
        />
      </div>

      <div className="w-full space-y-6">
        {/* Legal Consent */}
        <div className="space-y-3 px-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setAgreedTerms(!agreedTerms)} 
              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                agreedTerms 
                  ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                  : 'border-slate-200 dark:border-white/10 group-hover:border-slate-300'
              }`}
            >
              {agreedTerms && <Check size={12} className="text-white" />}
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">
              I agree to the{' '}
              <button 
                onClick={() => setModalType('terms')} 
                className="text-slate-900 dark:text-white underline"
              >
                Terms of Service
              </button>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setAgreedPrivacy(!agreedPrivacy)} 
              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                agreedPrivacy 
                  ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                  : 'border-slate-200 dark:border-white/10 group-hover:border-slate-300'
              }`}
            >
              {agreedPrivacy && <Check size={12} className="text-white" />}
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">
              I agree to the{' '}
              <button 
                onClick={() => setModalType('privacy')} 
                className="text-slate-900 dark:text-white underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>
        </div>

        <button 
          onClick={handleConnect} 
          disabled={!agreedTerms || !agreedPrivacy}
          className={`w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
            agreedTerms && agreedPrivacy 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Wallet size={18} />
          Initialize Terminal
        </button>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider">
          Blockchain-Verified Handshake Protocol Enabled.
        </p>
      </div>
    </div>
  );
};

const FeaturePill: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm">
    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</div>
      <div className="text-[10px] text-slate-400 font-medium truncate">{desc}</div>
    </div>
  </div>
);
