
import React, { useState } from 'react';
import { Zap, ShieldCheck, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Stake TON, Mine SMART",
      description: "Secure your position in the AI future by staking your TON. Earn up to 15% APY in SMART tokens every second.",
      icon: <Zap size={48} className="text-green-500" />,
      color: "bg-green-500/10",
      accent: "text-green-500"
    },
    {
      title: "AI-Powered Yield",
      description: "Our protocol utilizes decentralized AI agents to optimize validator selection, ensuring maximum stability and yield for our miners.",
      icon: <ShieldCheck size={48} className="text-blue-500" />,
      color: "bg-blue-500/10",
      accent: "text-blue-500"
    },
    {
      title: "Network Milestones",
      description: "Invite others to build the world's largest AI mining pool. Unlock permanent boosts and direct USDT payouts as you reach milestones.",
      icon: <Users size={48} className="text-purple-500" />,
      color: "bg-purple-500/10",
      accent: "text-purple-500"
    }
  ];

  const next = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[48px] p-8 sm:p-10 shadow-2xl border border-slate-100 dark:border-white/5 space-y-10 animate-in fade-in zoom-in duration-500">
        
        {/* Slide Icon */}
        <div className={`w-24 h-24 ${current.color} rounded-[36px] flex items-center justify-center mx-auto transition-all duration-500`}>
          {current.icon}
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {current.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium px-4">
            {current.description}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? `w-8 ${current.accent.replace('text', 'bg')}` : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={next}
          className={`w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-white ${current.accent.replace('text', 'bg')}`}
        >
          {step === slides.length - 1 ? 'Start Mining' : 'Continue'}
          {step === slides.length - 1 ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>

      {/* Skip Button */}
      <button 
        onClick={onComplete}
        className="mt-8 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        Skip Tutorial
      </button>
    </div>
  );
};
