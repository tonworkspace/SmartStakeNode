import React from 'react';
import { RefreshCw } from 'lucide-react';

interface TonPriceDisplayProps {
  tonPrice: number;
  change24h: number;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  showEarnings?: boolean;
  dailyEarnings?: number;
  dailyUsdValue?: string;
  isStaking?: boolean;
  className?: string;
}

export const TonPriceDisplay: React.FC<TonPriceDisplayProps> = ({
  tonPrice,
  change24h,
  isLoading,
  error,
  onRefresh,
  showEarnings = false,
  dailyEarnings = 0,
  dailyUsdValue = '0',
  isStaking = false,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Real TON Price Display */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          TON: ${tonPrice.toFixed(2)}
        </span>
        {change24h !== 0 && (
          <span className={`font-bold ${
            change24h > 0 
              ? 'text-green-500' 
              : change24h < 0 
              ? 'text-red-500' 
              : 'text-slate-500'
          }`}>
            {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        )}
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="Refresh TON price"
          disabled={isLoading}
        >
          <RefreshCw 
            size={10} 
            className={`text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ${
              isLoading ? 'animate-spin' : ''
            }`} 
          />
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <span className="text-xs text-red-500">
          Price update failed
        </span>
      )}

      {/* Daily Earnings Display (Optional) */}
      {showEarnings && isStaking && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 px-4 py-1.5 rounded-full w-fit mx-auto border border-blue-100/30 dark:border-blue-500/20 shadow-sm animate-in zoom-in duration-300 backdrop-blur-sm">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
            <div className="flex flex-col items-start leading-tight text-left">
              <span className="text-[9px] font-black uppercase tracking-wider opacity-80">
                {dailyEarnings.toFixed(6)} TON/day
              </span>
              <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                ≈ ${dailyUsdValue} USD/day
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};