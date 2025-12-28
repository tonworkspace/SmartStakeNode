import React, { useState, useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { useAuth } from '@/hooks/useAuth'; 
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { safeToUserFriendlyAddress } from '@/utils/addressUtils'; // Your existing utils
import { toast, Toaster } from 'react-hot-toast'; // Ensure you have installed: npm install react-hot-toast

import { 
  Globe, 
  MessageSquare, 
  ExternalLink, 
  ChevronRight, 
  Copy, 
  LogOut, 
  User as UserIcon,
  Wallet,
} from 'lucide-react';

const SettingsComponent: React.FC<{ 
  theme: 'light' | 'dark'; 
  setTheme: (theme: 'light' | 'dark') => void;
  onResetAuth?: () => void;
  onResetSponsor?: () => void;
}> = ({ theme, onResetAuth, onResetSponsor }) => {
    // --- Logic & State from Old Design ---
    const { user } = useAuth();
    const { t } = useI18n();
    const [tonConnectUI] = useTonConnectUI();
    const connectedAddressString = useTonAddress();
    
    // Language State
    const supportedLanguages = [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'pt', label: 'Português' },
        { code: 'ru', label: 'Русский' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'ar', label: 'العربية' }
    ];
    
    const detectedLang = (typeof navigator !== 'undefined' ? navigator.language?.slice(0,2) : 'en') || 'en';
    const [language, setLanguage] = useState<string>(() => {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app_language') : null;
        return saved || (supportedLanguages.some(l => l.code === detectedLang) ? detectedLang : 'en');
    });


    // --- Handlers ---

    const handleCopyAddress = () => {
        if (connectedAddressString) {
            navigator.clipboard.writeText(connectedAddressString);
            toast.success(t('address_copied') || "Address copied", { 
                style: { background: '#333', color: '#fff' }
            });
        }
    };

    const handleDisconnect = async () => {
        try {
            await tonConnectUI.disconnect();
            toast.success(t('wallet_disconnected') || "Wallet disconnected");
        } catch (error) {
            console.error('Failed to disconnect:', error);
            toast.error("Failed to disconnect");
        }
    };

    const handleConnect = () => {
        tonConnectUI.openModal();
    };

    const handleChangeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        setLanguage(lang);
        try { localStorage.setItem('app_language_user_set', '1'); } catch {}
    };

    // Persist Language
    useEffect(() => {
        try {
            localStorage.setItem('app_language', language);
            window.dispatchEvent(new CustomEvent('app:language-change', { detail: { language } }));
        } catch {}
    }, [language]);


    // --- UI Configuration (New Design) ---
    
    const sections = [
        {
            title: t('preferences') || "Preferences",
            items: [
                {
                    id: 'lang',
                    label: t('language') || 'Language',
                    sub: supportedLanguages.find(l => l.code === language)?.label || 'English',
                    icon: <Globe size={18} className="text-slate-400" />,
                    // Custom Select for Language
                    action: (
                        <div className="relative">
                            <select
                                value={language}
                                onChange={handleChangeLanguage}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                            >
                                {supportedLanguages.map(l => (
                                    <option key={l.code} value={l.code}>{l.label}</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500 uppercase font-bold mr-1">
                                    {language.toUpperCase()}
                                </span>
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        </div>
                    )
                },
            ]
        },
       
    ];

    const socialLinks = [
        { name: 'Telegram', icon: <MessageSquare size={16} />, color: 'bg-blue-500/10 text-blue-500', url: 'https://t.me/SmartStake_Official' },
        { name: 'Community', icon: <UserIcon size={16} />, color: 'bg-green-500/10 text-green-500', url: 'https://t.me/SmartStake_Channel' },
        // { name: 'Whitepaper', icon: <HelpCircle size={16} />, color: 'bg-purple-500/10 text-purple-500', url: 'https://drive.google.com/file/d/1jm3d7oES1YblsPP6UKHDt_EV7NR7joSq/view?usp=sharing' }
    ];

    return (
        <div className={`w-full max-w-md mx-auto pb-10 font-sans ${theme === 'dark' ? 'dark' : ''}`}>
            {/* Toast Container */}
            <Toaster position="top-center" reverseOrder={false} />

            <div className="flex flex-col space-y-4 animate-in slide-in-from-right duration-500 p-0">
                {/* Account Section - User Profile */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-white border dark:border-white/10 shadow-lg shrink-0">
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <UserIcon size={24} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                {user?.first_name || 'Guest User'} {user?.last_name || 'Guest User'}

                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-400">Sponsor ID:</span>
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                    {user?.telegram_id || 'N/A'}
                                </span>
                            </div>
                        </div>
                        {user?.telegram_id && (
                             <div className="hidden sm:block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full border border-blue-100 dark:border-blue-500/20 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                Linked
                            </div>
                        )}
                    </div>

                    {/* Wallet Sub-section */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                         {connectedAddressString ? (
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                        <Wallet size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Connected</span>
                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                            {safeToUserFriendlyAddress(connectedAddressString)}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCopyAddress} 
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-green-500"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                         ) : (
                            <button 
                                onClick={handleConnect}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <Wallet size={16} />
                                {t('connect_wallet') || "Connect Wallet"}
                            </button>
                         )}
                    </div>

                    {/* Sponsor Code Sub-section */}
                    {user?.sponsor_code && (
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                        <UserIcon size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Your Sponsor Code</span>
                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {user.sponsor_code}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.sponsor_code || '');
                                        toast.success('Sponsor code copied!', { 
                                            style: { background: '#333', color: '#fff' }
                                        });
                                    }} 
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-purple-500"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Sections Loop */}
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] px-2">
                            {section.title}
                        </h3>
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                            {section.items.map((item, i) => (
                                <div 
                                    key={item.id} 
                                    className={`flex items-center justify-between p-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5 ${i !== section.items.length - 1 ? 'border-b border-slate-50 dark:border-white/5' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="text-slate-900 dark:text-white font-bold text-sm">
                                                {item.label}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                                {item.sub}
                                            </div>
                                        </div>
                                    </div>
                                    <div>{item.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Community Links */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] px-2">
                        Community
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {socialLinks.map((link, idx) => (
                            <a 
                                key={idx} 
                                href={link.url}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-slate-200 dark:hover:border-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 ${link.color} rounded-lg flex items-center justify-center`}>
                                        {link.icon}
                                    </div>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        {link.name}
                                    </span>
                                </div>
                                <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer Info & Disconnect */}
                <div className="pt-4 text-center space-y-4">
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em] px-8 leading-relaxed opacity-60">
                        Smart Protocol v1.0.0
                    </p>
                    
                    {/* Reset Auth Button */}
                    {onResetAuth && (
                        <button 
                            className=" hidden flex items-center gap-2 mx-auto text-[11px] font-black text-orange-400 hover:text-orange-500 transition-colors uppercase tracking-widest p-4 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-500/10"
                            onClick={onResetAuth}
                        >
                            <UserIcon size={14} />
                            Reset Welcome Screen
                        </button>
                    )}
                    
                    {/* Reset Sponsor Button */}
                    {onResetSponsor && (
                        <button 
                            className="hidden flex items-center gap-2 mx-auto text-[11px] font-black text-purple-400 hover:text-purple-500 transition-colors uppercase tracking-widest p-4 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-500/10"
                            onClick={onResetSponsor}
                        >
                            <UserIcon size={14} />
                            Reset Sponsor Gate
                        </button>
                    )}
                    
                    {connectedAddressString && (
                        <button 
                            className="flex items-center gap-2 mx-auto text-[11px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={handleDisconnect}
                        >
                            <LogOut size={14} />
                            {t('disconnect_wallet') || "Disconnect Wallet"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsComponent;