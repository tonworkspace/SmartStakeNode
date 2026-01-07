// Smart Stake AI Service Worker
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'smart-stake-v1.0.0';

// Get base path from current location
const getBasePath = () => {
  const path = self.location.pathname;
  // Extract base path (everything before the sw.js file)
  const basePath = path.replace('/sw.js', '/');
  return basePath === '/' ? '/' : basePath;
};

const BASE_PATH = getBasePath();
const OFFLINE_URL = `${BASE_PATH}offline.html`.replace(/\/+/g, '/');

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  BASE_PATH,
  OFFLINE_URL,
  `${BASE_PATH}manifest.json`.replace(/\/+/g, '/'),
  // Add your main JS/CSS bundles here (Vite will generate these)
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/ton-price/,
  /\/api\/user-data/,
  /supabase\.co.*\/rest\/v1\/users/,
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  console.log('[SW] Base path:', BASE_PATH);
  console.log('[SW] Cache URLs:', STATIC_CACHE_URLS);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        // Try to cache each URL individually to see which ones fail
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Static resources cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If navigation fails, serve offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API requests with cache-first strategy for specific endpoints
  if (shouldCacheAPI(request.url)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache, but also fetch fresh data in background
            fetchAndCache(request);
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetchAndCache(request);
        })
    );
    return;
  }

  // Handle static resources with cache-first strategy
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(request);
        })
    );
    return;
  }

  // Default: network-first for everything else
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'mining-sync') {
    event.waitUntil(syncMiningData());
  }
  
  if (event.tag === 'earnings-sync') {
    event.waitUntil(syncEarningsData());
  }
  
  if (event.tag === 'user-actions') {
    event.waitUntil(syncUserActions());
  }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_USER_DATA':
      cacheUserData(data);
      break;
      
    case 'QUEUE_ACTION':
      queueOfflineAction(data);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Helper functions
function shouldCacheAPI(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Fetch failed:', error);
    throw error;
  }
}

async function syncMiningData() {
  try {
    // Get queued mining data from IndexedDB
    const queuedData = await getQueuedMiningData();
    
    for (const data of queuedData) {
      await fetch('/api/sync-mining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Remove from queue after successful sync
      await removeFromQueue('mining', data.id);
    }
    
    console.log('[SW] Mining data synced successfully');
  } catch (error) {
    console.error('[SW] Mining sync failed:', error);
  }
}

async function syncEarningsData() {
  try {
    const queuedEarnings = await getQueuedEarnings();
    
    for (const earning of queuedEarnings) {
      await fetch('/api/sync-earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(earning)
      });
      
      await removeFromQueue('earnings', earning.id);
    }
    
    console.log('[SW] Earnings synced successfully');
  } catch (error) {
    console.error('[SW] Earnings sync failed:', error);
  }
}

async function syncUserActions() {
  try {
    const queuedActions = await getQueuedActions();
    
    for (const action of queuedActions) {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      
      if (response.ok) {
        await removeFromQueue('actions', action.id);
      }
    }
    
    console.log('[SW] User actions synced successfully');
  } catch (error) {
    console.error('[SW] User actions sync failed:', error);
  }
}

async function cacheUserData(userData) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(userData));
    await cache.put('/api/user-data-cached', response);
  } catch (error) {
    console.error('[SW] Failed to cache user data:', error);
  }
}

async function queueOfflineAction(action) {
  // Store action in IndexedDB for later sync
  // Implementation would use IndexedDB API
  console.log('[SW] Queued offline action:', action);
}

async function getCacheStatus() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  return {
    cacheSize: keys.length,
    lastUpdated: new Date().toISOString(),
    isOnline: navigator.onLine
  };
}

// Placeholder functions for IndexedDB operations
async function getQueuedMiningData() { return []; }
async function getQueuedEarnings() { return []; }
async function getQueuedActions() { return []; }
async function removeFromQueue(type, id) { return true; }