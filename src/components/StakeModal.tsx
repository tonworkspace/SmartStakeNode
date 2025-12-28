import React, { useState } from 'react';
import { X, ArrowDownLeft, TrendingUp } from 'lucide-react';
import { useTonAddress } from '@tonconnect/ui-react';
import { CURRENT_NETWORK } from '@/config/depositConfig';

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
  isLoading?: boolean;
}

export const StakeModal: React.FC<StakeModalProps> = ({
  isOpen,
  onClose,
  onDeposit,
  isLoading = false
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  
  // Hooks for deposit functionality
  const connectedAddress = useTonAddress();

  if (!isOpen) return null;

  const numAmount = parseFloat(customAmount) || 0;
  const isValidAmount = numAmount >= 1;

  // Calculate Daily ROI based on amount - Original tiered system
  const calculateDailyROI = (stakeAmount: number): number => {
    let baseDailyROI = 0.01; // 1% base daily ROI
    
    // Tier bonuses based on stake amount
    if (stakeAmount >= 1000) baseDailyROI = 0.03; // 3% daily for 1000+ TON
    else if (stakeAmount >= 500) baseDailyROI = 0.025; // 2.5% daily for 500+ TON
    else if (stakeAmount >= 100) baseDailyROI = 0.02; // 2% daily for 100+ TON
    else if (stakeAmount >= 50) baseDailyROI = 0.015; // 1.5% daily for 50+ TON
    
    return baseDailyROI;
  };

  // Calculate earnings using original simple daily ROI method
  const calculateEarnings = (amount: number, days: number = 1): number => {
    if (amount < 1) return 0;
    const dailyROI = calculateDailyROI(amount);
    return amount * dailyROI * days;
  };

  const dailyROI = calculateDailyROI(numAmount);
  const dailyEarnings = calculateEarnings(numAmount, 1);
  const weeklyEarnings = calculateEarnings(numAmount, 7);
  const monthlyEarnings = calculateEarnings(numAmount, 30);

  const handleSubmit = () => {
    if (isValidAmount && !isLoading && connectedAddress) {
      onDeposit(numAmount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full h-full max-w-none max-h-none shadow-2xl overflow-y-auto">
        <div className="p-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Deposit & Stake TON
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Stake TON to start earning Smart rewards
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white font-medium">Processing Deposit...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we confirm your transaction</p>
            </div>
          ) : (
            <>
              {/* Network & Connection Status */}
              <div className="mb-6">
                {connectedAddress ? (
                  <div className="bg-green-50 dark:bg-green-500/10 rounded-2xl p-4 border border-green-100 dark:border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-green-800 dark:text-green-300 text-sm">Wallet Connected</p>
                        <p className="text-green-600 dark:text-green-400 text-xs">
                          {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
                        </p>
                        <p className="text-green-500 dark:text-green-400 text-xs font-medium">
                          Network: {CURRENT_NETWORK.NAME}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4 border border-red-100 dark:border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-red-800 dark:text-red-300 text-sm">Wallet Required</p>
                        <p className="text-red-600 dark:text-red-400 text-xs">
                          Please connect your TON wallet to deposit
                        </p>
                        <p className="text-red-500 dark:text-red-400 text-xs font-medium">
                          Target Network: {CURRENT_NETWORK.NAME}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Display */}
              <div className="mb-8 text-center">
                <div className="flex items-baseline justify-center gap-2 mb-3">
                  <span className="text-6xl font-bold text-gray-900 dark:text-white">
                    {customAmount || '0'}
                  </span>
                  <span className="text-3xl font-medium text-gray-500 dark:text-gray-400">TON</span>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {(dailyROI * 100).toFixed(1)}% Daily ROI
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {dailyEarnings.toFixed(4)} TON daily earnings
                </p>
              </div>

              {/* Quick Select Grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 5, 10, 50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCustomAmount(amount.toString())}
                    className={`px-3 py-3 border rounded-lg transition-all duration-200 text-center group ${
                      customAmount === amount.toString()
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">{amount} TON</div>
                      <div className={`text-xs font-medium ${
                        customAmount === amount.toString()
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}>
                        {(calculateDailyROI(amount) * 100).toFixed(1)}% Daily
                      </div>
                      <div className={`text-xs ${
                        customAmount === amount.toString()
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      }`}>
                        {calculateEarnings(amount, 1).toFixed(4)} TON/day
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Enter custom amount"
                    min="1"
                    step="0.1"
                    value={customAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setCustomAmount(value);
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    TON
                  </div>
                </div>
              </div>

              {/* Minimum Staking Info */}
              <div className="flex justify-between items-center mb-6 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Minimum staking</span>
                <span className="font-medium text-gray-900 dark:text-white">1 TON</span>
              </div>

              {/* Enhanced Rewards Section */}
              {numAmount >= 1 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <TrendingUp size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Staking Projections</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Based on {(dailyROI * 100).toFixed(1)}% daily ROI</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {dailyEarnings.toFixed(4)} TON
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Daily Earnings
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Daily ROI Rate:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {(dailyROI * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Weekly Earnings:</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {weeklyEarnings.toFixed(4)} TON
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Earnings:</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        {monthlyEarnings.toFixed(4)} TON
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Earnings are calculated using tiered daily ROI rates. Higher stakes earn better rates.
                  </p>
                </div>
              )}

              {/* Deposit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isValidAmount || isLoading || !connectedAddress}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                  !isValidAmount || isLoading || !connectedAddress
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : !connectedAddress ? (
                  <div className="flex items-center justify-center gap-2">
                    <ArrowDownLeft size={18} />
                    Connect Wallet to Deposit
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ArrowDownLeft size={18} />
                    Deposit & Stake TON
                  </div>
                )}
              </button>

              {/* Info Footer */}
              <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                The deposit will be credited automatically, once the transaction is confirmed
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};