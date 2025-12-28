import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Cpu, Fingerprint, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface SponsorGateProps {
  onUnlock: () => void;
}

export const SponsorGate: React.FC<SponsorGateProps> = ({ onUnlock }) => {
  const { user, updateUserData } = useAuth();
  const [sponsorCode, setSponsorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [sponsorInfo, setSponsorInfo] = useState<{ username: string; id: number } | null>(null);

  const handleVerify = async () => {
    if (!sponsorCode.trim() || !user?.id) return;
    
    setIsVerifying(true);
    setError('');
    
    try {
      // Handle bypass codes
      const bypassCodes = ['GENESIS', 'ADMIN', 'TEST', 'DEV', 'BYPASS'];
      if (bypassCodes.includes(sponsorCode.toUpperCase())) {
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSponsorInfo({ username: `${sponsorCode.toUpperCase()} Protocol`, id: 0 });
        setIsVerified(true);
        setIsVerifying(false);
        return;
      }

      // Check if current user is the first user (admin)
      const { data: isFirstUser, error: firstUserError } = await supabase.rpc('is_first_user', {
        p_user_id: user.id
      });

      if (firstUserError) {
        console.error('Error checking first user:', firstUserError);
      }

      // If user is the first user, they don't need a sponsor
      if (isFirstUser) {
        setSponsorInfo({ username: 'System Admin', id: 0 });
        setIsVerified(true);
        setIsVerifying(false);
        return;
      }

      // Look for sponsor by telegram_id (sponsor code is telegram_id)
      const { data: sponsorData, error: sponsorError } = await supabase
        .from('users')
        .select('id, username, telegram_id')
        .eq('telegram_id', sponsorCode.trim())
        .single();

      if (sponsorError || !sponsorData) {
        throw new Error('Invalid sponsor code. Please check and try again.');
      }

      // Check if user is trying to use their own telegram_id
      if (sponsorData.telegram_id === user.telegram_id) {
        throw new Error('You cannot use your own Telegram ID as sponsor code.');
      }

      // Check if user already has a sponsor
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
        .single();

      if (existingReferral) {
        throw new Error('You already have a sponsor assigned.');
      }

      // Apply the sponsor code using the atomic function
      const { data: applyResult, error: applyError } = await supabase.rpc('apply_sponsor_code_atomic', {
        p_sponsor_id: sponsorData.id,
        p_referred_id: user.id
      });

      if (applyError) {
        throw new Error(applyError.message || 'Failed to apply sponsor code.');
      }

      // Update local user data with the new sponsor_id
      await updateUserData({ 
        sponsor_id: sponsorData.id
      });

      // Force a refresh of the user data
      if (user?.id) {
        await updateUserData({ id: user.id });
      }

      // Success - use data from the atomic function result if available
      const resultData = applyResult || {};
      setSponsorInfo({ 
        username: resultData.sponsor_username || sponsorData.username, 
        id: sponsorData.id 
      });
      setIsVerified(true);

    } catch (err: any) {
      console.error('Sponsor verification error:', err);
      
      // Handle different types of errors
      let errorMessage = 'Verification failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'PGRST116') {
        errorMessage = 'Invalid sponsor code. Please check and try again.';
      } else if (err.code === 'PGRST301') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700 max-w-sm mx-auto w-full">
      {/* Visual Identity */}
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping scale-150 blur-3xl opacity-50" />
        <div className="w-24 h-24 bg-slate-900 dark:bg-white rounded-[32px] flex items-center justify-center text-white dark:text-slate-900 relative z-10 border border-white/10 shadow-2xl">
          {isVerified ? (
            <Fingerprint size={48} className="text-green-500 animate-in zoom-in" />
          ) : error ? (
            <AlertCircle size={40} className="text-red-500" />
          ) : (
            <Lock size={40} className={isVerifying ? 'animate-pulse text-slate-400' : 'text-slate-600'} />
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
          {isVerified ? 'Terminal Authorized' : error ? 'Verification Failed' : 'Sponsor Activation'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-relaxed uppercase tracking-widest">
          {isVerified 
            ? 'Your neural link is established. Protocol yield is now active.' 
            : error
            ? 'Please check your sponsor Telegram ID and try again.'
            : 'Enter your sponsor\'s Telegram ID to synchronize your node with the Smart AI network.'
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 p-4 rounded-[20px] animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-[11px] font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Input Section */}
      {!isVerified ? (
        <div className="w-full space-y-4 animate-in slide-in-from-bottom duration-500">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
              <Cpu size={18} />
            </div>
            <input 
              type="text"
              value={sponsorCode}
              onChange={(e) => {
                // Only allow numeric input for Telegram IDs
                const value = e.target.value.replace(/[^0-9]/g, '');
                setSponsorCode(value);
                setError(''); // Clear error when user types
              }}
              placeholder="ENTER TELEGRAM ID"
              className={`w-full h-16 bg-white dark:bg-slate-900 border-2 rounded-[24px] pl-14 pr-6 text-sm font-black tracking-[0.2em] outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700 ${
                error 
                  ? 'border-red-500/50 focus:border-red-500' 
                  : 'border-slate-100 dark:border-white/5 focus:border-green-500/50'
              }`}
              disabled={isVerifying}
            />
          </div>

          <button 
            onClick={handleVerify}
            disabled={!sponsorCode.trim() || isVerifying}
            className={`w-full py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
              isVerifying 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
                : !sponsorCode.trim()
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                Verifying Telegram ID...
              </>
            ) : (
              'Verify Sponsor ID'
            )}
          </button>

          <p className="text-[9px] text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
            Need a sponsor ID?{' '}
            <button 
              onClick={() => setSponsorCode('GENESIS')}
              className="text-green-500 hover:text-green-400 underline transition-colors"
              disabled={isVerifying}
            >
              Use GENESIS
            </button>
            {' '}to bypass.
          </p>
        </div>
      ) : (
        <div className="w-full space-y-4 animate-in zoom-in duration-500">
          <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 p-5 rounded-[28px] flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-green-200 dark:shadow-none">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Sponsor Verified</div>
              <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                Linked to: {sponsorInfo?.username || 'Unknown'}
              </div>
            </div>
            <ShieldCheck className="text-green-500" size={20} />
          </div>

          <button 
            onClick={onUnlock}
            className="w-full py-5 bg-green-500 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Initialize Terminal
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Footer Trust */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/5 w-full flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Verification Protocol</span>
        </div>
      </div>
    </div>
  );
};