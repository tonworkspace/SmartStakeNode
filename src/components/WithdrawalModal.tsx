import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertTriangle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useTonAddress } from '@tonconnect/ui-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdrawalRequest: (amount: number, address: string) => void;
  isLoading?: boolean;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  tx_hash?: string;
  rejection_reason?: string;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onWithdrawalRequest,
  isLoading = false
}) => {
  const { user } = useAuth();
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [recentRequests, setRecentRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Hooks for withdrawal functionality
  const connectedAddress = useTonAddress();

  // Withdrawal limits and fees
  const MIN_WITHDRAWAL = 1; // 1 TON minimum
  const WITHDRAWAL_FEE = 0.1; // 0.1 TON fee
  const MAX_DAILY_WITHDRAWALS = 3;

  useEffect(() => {
    if (isOpen && user?.id) {
      loadAvailableBalance();
      loadRecentRequests();
      // Auto-fill connected wallet address
      if (connectedAddress) {
        setWithdrawalAddress(connectedAddress);
      }
    }
  }, [isOpen, user?.id, connectedAddress]);

  const loadAvailableBalance = async () => {
    if (!user?.id) return;
    
    setIsLoadingBalance(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('available_earnings, total_earned')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setAvailableBalance(Number(userData.available_earnings) || 0);
      }
    } catch (error) {
      console.error('Failed to load available balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadRecentRequests = async () => {
    if (!user?.id) return;
    
    try {
      const { data: requests } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (requests) {
        setRecentRequests(requests);
      }
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
    }
  };

  const getTodayRequestsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return recentRequests.filter(req => 
      req.created_at.startsWith(today) && req.status !== 'rejected'
    ).length;
  };

  const numAmount = parseFloat(withdrawalAmount) || 0;
  const totalWithFee = numAmount + WITHDRAWAL_FEE;
  const isValidAmount = numAmount >= MIN_WITHDRAWAL && totalWithFee <= availableBalance;
  const isValidAddress = withdrawalAddress.length > 10; // Basic validation
  const canWithdraw = isValidAmount && isValidAddress && getTodayRequestsCount() < MAX_DAILY_WITHDRAWALS;

  const handleSubmit = () => {
    if (canWithdraw && !isLoading) {
      onWithdrawalRequest(numAmount, withdrawalAddress);
      setWithdrawalAmount('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'processing':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'rejected':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full h-full max-w-none max-h-none shadow-2xl overflow-y-auto">
        <div className="p-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Withdraw Earnings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Request withdrawal of your staking rewards
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
              <p className="text-gray-900 dark:text-white font-medium">Processing Withdrawal Request...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we process your request</p>
            </div>
          ) : (
            <>
              {/* Available Balance */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl p-6 border border-green-100 dark:border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Available for Withdrawal</p>
                      <div className="flex items-baseline gap-2">
                        {isLoadingBalance ? (
                          <Loader2 size={24} className="text-green-600 animate-spin" />
                        ) : (
                          <>
                            <span className="text-3xl font-bold text-green-900 dark:text-green-100">
                              {availableBalance.toFixed(6)}
                            </span>
                            <span className="text-lg font-medium text-green-700 dark:text-green-300">TON</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Daily Limit</p>
                      <p className="text-sm font-bold text-green-800 dark:text-green-200">
                        {getTodayRequestsCount()}/{MAX_DAILY_WITHDRAWALS} requests
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Form */}
              <div className="space-y-6 mb-8">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Enter amount to withdraw"
                      min={MIN_WITHDRAWAL}
                      max={availableBalance - WITHDRAWAL_FEE}
                      step="0.000001"
                      value={withdrawalAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                          setWithdrawalAmount(value);
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                      TON
                    </div>
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2 mt-3">
                    {[25, 50, 75, 100].map((percentage) => {
                      const amount = (availableBalance - WITHDRAWAL_FEE) * (percentage / 100);
                      return (
                        <button
                          key={percentage}
                          onClick={() => setWithdrawalAmount(amount.toFixed(6))}
                          disabled={amount < MIN_WITHDRAWAL}
                          className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {percentage}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Address Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    TON Wallet Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your TON wallet address"
                    value={withdrawalAddress}
                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {connectedAddress && (
                    <button
                      onClick={() => setWithdrawalAddress(connectedAddress)}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Use connected wallet: {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-6)}
                    </button>
                  )}
                </div>

                {/* Fee Information */}
                {numAmount > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border border-blue-100 dark:border-blue-500/20">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Transaction Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-blue-800 dark:text-blue-200">
                        <span>Withdrawal Amount:</span>
                        <span>{numAmount.toFixed(6)} TON</span>
                      </div>
                      <div className="flex justify-between text-blue-800 dark:text-blue-200">
                        <span>Network Fee:</span>
                        <span>{WITHDRAWAL_FEE.toFixed(1)} TON</span>
                      </div>
                      <div className="border-t border-blue-200 dark:border-blue-400/30 pt-1 mt-2">
                        <div className="flex justify-between font-medium text-blue-900 dark:text-blue-100">
                          <span>Total Deducted:</span>
                          <span>{totalWithFee.toFixed(6)} TON</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Messages */}
                {withdrawalAmount && !isValidAmount && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle size={16} />
                    <span>
                      {numAmount < MIN_WITHDRAWAL 
                        ? `Minimum withdrawal is ${MIN_WITHDRAWAL} TON`
                        : 'Insufficient balance (including fees)'
                      }
                    </span>
                  </div>
                )}

                {getTodayRequestsCount() >= MAX_DAILY_WITHDRAWALS && (
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
                    <AlertTriangle size={16} />
                    <span>Daily withdrawal limit reached. Try again tomorrow.</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!canWithdraw || isLoading}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                  !canWithdraw || isLoading
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUpRight size={18} />
                    Request Withdrawal
                  </div>
                )}
              </button>

              {/* Recent Requests */}
              {recentRequests.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Requests</h3>
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(request.status)}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {request.amount.toFixed(6)} TON
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                            {request.tx_hash && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                TX: {request.tx_hash.slice(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                        {request.rejection_reason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Reason: {request.rejection_reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Footer */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Withdrawal Information</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Minimum withdrawal: {MIN_WITHDRAWAL} TON</li>
                  <li>• Network fee: {WITHDRAWAL_FEE} TON per transaction</li>
                  <li>• Daily limit: {MAX_DAILY_WITHDRAWALS} requests per day</li>
                  <li>• Processing time: 24-48 hours for manual review</li>
                  <li>• Withdrawals are processed to TON mainnet only</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};