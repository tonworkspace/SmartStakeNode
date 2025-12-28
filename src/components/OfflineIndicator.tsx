// Offline status indicator component
import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { 
    isOnline, 
    queueSize, 
    isSyncing, 
    lastSyncTime, 
    hasQueuedActions,
    syncQueuedData 
  } = useOfflineSync();

  const getStatusIcon = () => {
    if (isSyncing) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (hasQueuedActions) {
      return <CloudOff className="w-4 h-4 text-orange-500" />;
    }
    
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (hasQueuedActions) return `${queueSize} pending`;
    return 'Online';
  };

  const getStatusColor = () => {
    if (isSyncing) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (!isOnline) return 'text-red-600 bg-red-50 border-red-200';
    if (hasQueuedActions) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  if (showDetails) {
    return (
      <div className={`p-4 rounded-lg border ${getStatusColor()} ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          
          {hasQueuedActions && isOnline && !isSyncing && (
            <button
              onClick={syncQueuedData}
              className="px-3 py-1 text-sm bg-white rounded-md border hover:bg-gray-50 transition-colors"
            >
              Sync Now
            </button>
          )}
        </div>
        
        {!isOnline && (
          <div className="text-sm opacity-75">
            <p>Your mining continues offline. Data will sync when connection is restored.</p>
          </div>
        )}
        
        {hasQueuedActions && (
          <div className="text-sm opacity-75">
            <p>{queueSize} actions waiting to sync</p>
          </div>
        )}
        
        {lastSyncTime && (
          <div className="text-xs opacity-60 mt-1">
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  // Compact indicator
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      
      {hasQueuedActions && (
        <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">
          {queueSize}
        </span>
      )}
    </div>
  );
};

// Connection status banner for critical offline states
export const OfflineBanner: React.FC = () => {
  const { isOnline, hasQueuedActions, queueSize, syncQueuedData } = useOfflineSync();

  if (isOnline && !hasQueuedActions) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-2">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                Offline Mode - Mining continues locally
              </span>
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4" />
              <span className="text-sm font-medium">
                {queueSize} actions ready to sync
              </span>
            </>
          )}
        </div>
        
        {isOnline && hasQueuedActions && (
          <button
            onClick={syncQueuedData}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};