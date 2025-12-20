
import React from 'react';
import { Rocket, Shield, Bot, Zap, Sparkles, Crown } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  username: string;
  size?: AvatarSize;
  className?: string;
}

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-cyan-600",
  "from-blue-500 to-indigo-700",
  "from-violet-500 to-purple-700",
  "from-amber-400 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-400 to-blue-500",
  "from-green-400 to-emerald-600",
  "from-indigo-400 to-blue-600"
];

const AVATAR_ICONS = [Rocket, Shield, Bot, Zap, Sparkles, Crown];

export const UserAvatar: React.FC<UserAvatarProps> = ({ username, size = 'md', className = '' }) => {
  // Deterministic selection based on string hash
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const hash = getHash(username || "S");
  const gradient = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  const Icon = AVATAR_ICONS[hash % AVATAR_ICONS.length];

  const sizeClasses = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-16 h-16 rounded-[24px]",
    xl: "w-24 h-24 rounded-[32px]"
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 28,
    xl: 40
  };

  return (
    <div className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${gradient} shadow-lg ${sizeClasses[size]} ${className}`}>
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_60%)]" />
      
      {/* Icon Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center text-white drop-shadow-md">
        <Icon size={iconSizes[size]} strokeWidth={2.5} />
      </div>

      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-10 mix-blend-overlay">
        <svg width="100%" height="100%">
          <pattern id="pattern-hex" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#pattern-hex)" />
        </svg>
      </div>
    </div>
  );
};
