import React, { useState, useEffect } from 'react';
import { Zap, Clock, Star, Rocket, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface Boost {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  duration: number; // in minutes
  cost: number; // in SBT tokens
  icon: React.ComponentType<any>;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface MiningBoostSystemProps {
  onBoostActivated: (multiplier: number, duration: number) => void;
  showSnackbar: (config: { message: string; description?: string }) => void;
}

const AVAILABLE_BOOSTS: Boost[] = [
  {
    id: 'speed_2x',
    name: '2x Speed Boost',
    description: 'Double your mining speed for 1 hour',
    multiplier: 2,
    duration: 60,
    cost: 100,
    icon: Zap,
    color: 'from-yellow-400 to-orange-500',
    rarity: 'common'
  },
  {
    id: 'speed_3x',
    name: '3x Speed Boost',
    description: 'Triple your mining speed for 30 minutes',
    multiplier: 3,
    duration: 30,
    cost: 200,
    icon: Rocket,
    color: 'from-blue-400 to-purple-500',
    rarity: 'rare'
  },
  {
    id: 'speed_5x',
    name: '5x Mega Boost',
    description: 'Quintuple your mining speed for 15 minutes',
    multiplier: 5,
    duration: 15,
    cost: 500,
    icon: Star,
    color: 'from-purple-400 to-pink-500',
    rarity: 'epic'
  },
  {
    id: 'speed_10x',
    name: '10x Ultra Boost',
    description: 'Extreme mining speed for 5 minutes',
    multiplier: 10,
    duration: 5,
    cost: 1000,
    icon: Crown,
    color: 'from-pink-400 to-red-500',
    rarity: 'legendary'
  }
];

export const MiningBoostSystem: React.FC<MiningBoostSystemProps> = ({
  onBoostActivated,
  showSnackbar
}) => {
  const { user, updateUserData } = useAuth();
  const [activeBoost, setActiveBoost] = useState<Boost | null>(null);
  const [boostTimeRemaining, setBoostTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userSBT, setUserSBT] = useState<number>(0);

  // Load user SBT balance
  useEffect(() => {
    if (user?.total_sbt) {
      setUserSBT(user.total_sbt);
    }
  }, [user?.total_sbt]);

  // Countdown timer for active boost
  useEffect(() => {
    if (boostTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBoostTimeRemaining(prev => {
          if (prev <= 1) {
            setActiveBoost(null);
            onBoostActivated(1, 0); // Reset to normal speed
            showSnackbar({
              message: 'Boost Expired',
              description: 'Your mining boost has ended. Purchase another to continue!'
            });
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [boostTimeRemaining, onBoostActivated, showSnackbar]);

  // Purchase and activate boost
  const purchaseBoost = async (boost: Boost) => {
    if (!user?.id) return;
    
    if (userSBT < boost.cost) {
      showSnackbar({
        message: 'Insufficient SBT',
        description: `You need ${boost.cost} SBT tokens to purchase this boost`
      });
      return;
    }

    if (activeBoost) {
      showSnackbar({
        message: 'Boost Already Active',
        description: 'Wait for your current boost to expire before purchasing another'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Deduct SBT cost
      const { error: deductError } = await supabase.rpc('increment_sbt', {
        user_id: user.id,
        amount: -boost.cost
      });

      if (deductError) throw deductError;

      // Record boost purchase
      const { error: recordError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'boost_purchase',
          amount: boost.cost,
          status: 'completed',
          metadata: {
            boost_id: boost.id,
            multiplier: boost.multiplier,
            duration: boost.duration
          },
          created_at: new Date().toISOString()
        });

      if (recordError) throw recordError;

      // Activate boost
      setActiveBoost(boost);
      setBoostTimeRemaining(boost.duration);
      setUserSBT(prev => prev - boost.cost);
      
      // Notify parent component
      onBoostActivated(boost.multiplier, boost.duration);
      
      // Update user data
      await updateUserData({ 
        total_sbt: userSBT - boost.cost,
        speed_boost_active: true 
      });

      showSnackbar({
        message: `${boost.name} Activated!`,
        description: `Your mining speed is now ${boost.multiplier}x for ${boost.duration} minutes!`
      });

    } catch (error: any) {
      console.error('Error purchasing boost:', error);
      showSnackbar({
        message: 'Purchase Failed',
        description: 'Failed to purchase boost. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Active Boost Display */}
      {activeBoost && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <activeBoost.icon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">{activeBoost.name} Active</h3>
                <p className="text-xs opacity-90">{activeBoost.multiplier}x Mining Speed</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatTime(boostTimeRemaining)}</div>
              <div className="text-xs opacity-90">remaining</div>
            </div>
          </div>
          <div className="mt-3 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000"
              style={{ 
                width: `${(boostTimeRemaining / activeBoost.duration) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Boost Shop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Mining Boosts
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Star size={16} className="text-yellow-500" />
            <span>{userSBT.toLocaleString()} SBT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_BOOSTS.map((boost) => {
            const Icon = boost.icon;
            const canAfford = userSBT >= boost.cost;
            const isDisabled = isLoading || !!activeBoost || !canAfford;

            return (
              <button
                key={boost.id}
                onClick={() => purchaseBoost(boost)}
                disabled={isDisabled}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  getRarityColor(boost.rarity)
                } ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:shadow-lg active:scale-95'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${boost.color} flex items-center justify-center text-white`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {boost.multiplier}x
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatTime(boost.duration)}
                    </div>
                  </div>
                </div>
                
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {boost.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  {boost.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {boost.cost.toLocaleString()}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    boost.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                    boost.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                    boost.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                    'bg-yellow-200 text-yellow-700'
                  }`}>
                    {boost.rarity}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Boost Tips */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-blue-500" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Boost Tips
          </h4>
        </div>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Boosts multiply your real-time mining speed</li>
          <li>• Higher tier boosts give better value per minute</li>
          <li>• Only one boost can be active at a time</li>
          <li>• Earn SBT tokens by completing social tasks</li>
        </ul>
      </div>
    </div>
  );
};