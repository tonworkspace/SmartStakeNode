// Service Worker Registration and Management
// Handles SW lifecycle, updates, and communication

interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

interface CacheStatus {
  cacheSize: number;
  lastUpdated: string;
  isOnline: boolean;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdateAvailable = false;
  private updateCallbacks: Array<() => void> = [];

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.isUpdateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister();
    }
    return false;
  }

  // Update service worker to new version
  async update(): Promise<void> {
    if (this.registration?.waiting) {
      this.sendMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Check if update is available
  isUpdateReady(): boolean {
    return this.isUpdateAvailable;
  }

  // Register callback for when update is available
  onUpdateAvailable(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }

  // Send message to service worker
  sendMessage(message: ServiceWorkerMessage): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // Cache user data for offline access
  cacheUserData(userData: any): void {
    this.sendMessage({
      type: 'CACHE_USER_DATA',
      data: userData
    });
  }

  // Queue action for when back online
  queueOfflineAction(action: any): void {
    this.sendMessage({
      type: 'QUEUE_ACTION',
      data: action
    });
  }

  // Get cache status
  async getCacheStatus(): Promise<CacheStatus | null> {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve(null);
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  private handleMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'SW_UPDATED':
        this.isUpdateAvailable = true;
        this.notifyUpdateAvailable();
        break;

      case 'SYNC_COMPLETE':
        console.log('Background sync completed:', data);
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('sw-sync-complete', { detail: data }));
        break;

      case 'CACHE_UPDATED':
        console.log('Cache updated:', data);
        window.dispatchEvent(new CustomEvent('sw-cache-updated', { detail: data }));
        break;
    }
  }

  private notifyUpdateAvailable(): void {
    this.updateCallbacks.forEach(callback => callback());
  }
}

// Offline queue management using IndexedDB
class OfflineQueue {
  private dbName = 'SmartStakeOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for different types of offline data
        if (!db.objectStoreNames.contains('miningData')) {
          db.createObjectStore('miningData', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('earnings')) {
          db.createObjectStore('earnings', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('userActions')) {
          db.createObjectStore('userActions', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async addToQueue(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.add({
        ...data,
        timestamp: Date.now(),
        synced: false
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedItems(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result.filter(item => !item.synced);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(storeName: string, id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearSynced(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Connection status manager
class ConnectionManager {
  private isOnline = navigator.onLine;
  private callbacks: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks();
    });
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  onStatusChange(callback: (isOnline: boolean) => void): void {
    this.callbacks.push(callback);
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.isOnline));
  }
}

// Export instances
export const serviceWorkerManager = new ServiceWorkerManager();
export const offlineQueue = new OfflineQueue();
export const connectionManager = new ConnectionManager();

// Initialize service worker
export async function initializeServiceWorker(): Promise<boolean> {
  // Don't block app loading - initialize in background
  try {
    const registered = await serviceWorkerManager.register();
    
    if (registered) {
      // Initialize offline queue in background
      offlineQueue.init().catch(err => {
        console.warn('Offline queue initialization failed:', err);
      });
      
      console.log('Service Worker and offline systems initialized');
    }
    
    return registered;
  } catch (error) {
    console.warn('Service Worker initialization failed (non-blocking):', error);
    return false;
  }
}