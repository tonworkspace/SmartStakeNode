import React from 'react';
import { Cloud } from 'lucide-react';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  username?: string;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isSyncing,
  username,
  className = ''
}) => {
  return (
    <span className={`text-[7px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1 mt-1 animate-pulse ${className}`}>
      <Cloud size={8} />
      {isSyncing ? 'Syncing...' : `Welcome! ${username || ''}`}
    </span>
  );
};