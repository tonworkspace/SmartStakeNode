// React hook for offline synchronization
import { useState, useEffect, useCallback } from 'react';
import { offlineQueue, connectionManager } from '@/utils/serviceWorker';
import { useAuth } from '@/hooks/useAuth';

interface OfflineSyncState {
  isOnline: boolean;
  queueSize: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  hasQueuedActions: boolean;
}

interface QueuedAction {
  type: 'mining' | 'earnings' | 'stake' | 'claim' | 'social_task';
  data: any;
  timestamp: number;
}

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<OfflineSyncState>({
    isOnline: connectionManager.getStatus(),
    queueSize: 0,
    isSyncing: false,
    lastSyncTime: null,
    hasQueuedActions: false
  });

  // Queue mining data when offline
  const queueMiningData = useCallback(async (miningData: any) => {
    if (!syncState.isOnline && user?.id) {
      await offlineQueue.addToQueue('miningData', {
        userId: user.id,
        ...miningData
      });
      
      updateQueueSize();
    }
  }, [syncState.isOnline, user?.id]);

  // Queue earnings when offline
  const queueEarnings = useCallback(async (earningsData: any) => {
    if (!syncState.isOnline && user?.id) {
      await offlineQueue.addToQueue('earnings', {
        userId: user.id,
        ...earningsData
      });
      
      updateQueueSize();
    }
  }, [syncState.isOnline, user?.id]);

  // Queue user actions when offline
  const queueUserAction = useCallback(async (action: QueuedAction) => {
    if (!syncState.isOnline && user?.id) {
      await offlineQueue.addToQueue('userActions', {
        userId: user.id,
        ...action
      });
      
      updateQueueSize();
    }
  }, [syncState.isOnline, user?.id]);

  // Sync all queued data
  const syncQueuedData = useCallback(async () => {
    if (!syncState.isOnline || syncState.isSyncing) return;

    setSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      // Sync mining data
      const miningData = await offlineQueue.getQueuedItems('miningData');
      for (const item of miningData) {
        // Sync with your API
        await syncMiningDataToServer(item);
        await offlineQueue.markAsSynced('miningData', item.id);
      }

      // Sync earnings
      const earnings = await offlineQueue.getQueuedItems('earnings');
      for (const item of earnings) {
        await syncEarningsToServer(item);
        await offlineQueue.markAsSynced('earnings', item.id);
      }

      // Sync user actions
      const actions = await offlineQueue.getQueuedItems('userActions');
      for (const item of actions) {
        await syncUserActionToServer(item);
        await offlineQueue.markAsSynced('userActions', item.id);
      }

      // Clean up synced items
      await offlineQueue.clearSynced('miningData');
      await offlineQueue.clearSynced('earnings');
      await offlineQueue.clearSynced('userActions');

      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        queueSize: 0,
        hasQueuedActions: false
      }));

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [syncState.isOnline, syncState.isSyncing]);

  // Update queue size
  const updateQueueSize = useCallback(async () => {
    try {
      const miningCount = (await offlineQueue.getQueuedItems('miningData')).length;
      const earningsCount = (await offlineQueue.getQueuedItems('earnings')).length;
      const actionsCount = (await offlineQueue.getQueuedItems('userActions')).length;
      
      const totalSize = miningCount + earningsCount + actionsCount;
      
      setSyncState(prev => ({
        ...prev,
        queueSize: totalSize,
        hasQueuedActions: totalSize > 0
      }));
    } catch (error) {
      console.error('Failed to update queue size:', error);
    }
  }, []);

  // Handle connection status changes
  useEffect(() => {
    const handleConnectionChange = (isOnline: boolean) => {
      setSyncState(prev => ({ ...prev, isOnline }));
      
      if (isOnline) {
        // Auto-sync when coming back online
        setTimeout(syncQueuedData, 1000);
      }
    };

    connectionManager.onStatusChange(handleConnectionChange);
    
    // Initial queue size check
    updateQueueSize();
  }, [syncQueuedData, updateQueueSize]);

  // Listen for service worker sync events
  useEffect(() => {
    const handleSyncComplete = (event: CustomEvent) => {
      console.log('Background sync completed:', event.detail);
      updateQueueSize();
    };

    window.addEventListener('sw-sync-complete', handleSyncComplete as EventListener);
    
    return () => {
      window.removeEventListener('sw-sync-complete', handleSyncComplete as EventListener);
    };
  }, [updateQueueSize]);

  return {
    ...syncState,
    queueMiningData,
    queueEarnings,
    queueUserAction,
    syncQueuedData,
    updateQueueSize
  };
};

// Helper functions to sync with your backend
async function syncMiningDataToServer(data: any): Promise<void> {
  // Implement your mining data sync logic
  console.log('Syncing mining data:', data);
  
  // Example API call
  // await fetch('/api/sync-mining', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
}

async function syncEarningsToServer(data: any): Promise<void> {
  // Implement your earnings sync logic
  console.log('Syncing earnings:', data);
  
  // Example API call
  // await fetch('/api/sync-earnings', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
}

async function syncUserActionToServer(data: any): Promise<void> {
  // Implement your user action sync logic
  console.log('Syncing user action:', data);
  
  // Example API call based on action type
  // switch (data.type) {
  //   case 'claim':
  //     await fetch('/api/claim-rewards', { ... });
  //     break;
  //   case 'stake':
  //     await fetch('/api/create-stake', { ... });
  //     break;
  //   // ... other actions
  // }
}