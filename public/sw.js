const CACHE_NAME = 'bookmyvenue-v2';
const STATIC_CACHE = 'bookmyvenue-static-v2';
const DYNAMIC_CACHE = 'bookmyvenue-dynamic-v2';
const IMAGE_CACHE = 'bookmyvenue-images-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/venues',
  '/catering',
  '/offline',
  '/site.webmanifest',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/featured',
  '/api/venues',
  '/api/catering',
  '/api/areas',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip all auth-related routes - must not be intercepted
  if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin) && 
      !url.hostname.includes('cloudinary.com') &&
      !url.hostname.includes('res.cloudinary.com')) {
    return;
  }

  // Handle API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Handle images - Cache first
  if (
    request.destination === 'image' ||
    url.hostname.includes('cloudinary.com') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Handle navigation - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).catch(() => {
        return caches.match('/offline') || new Response('Offline');
      })
    );
    return;
  }

  // Handle other static assets - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first fetch failed:', error);
    return new Response('', { status: 408, statusText: 'Request timeout' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = (async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const responseToCache = response.clone();
        const cache = await caches.open(cacheName);
        await cache.put(request, responseToCache);
      }
      return response;
    } catch {
      return cached;
    }
  })();

  return cached || fetchPromise;
}

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  try {
    console.log('[SW] Starting background sync of offline requests...');
    
    // Open the offline database
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('BookMyVenue_Offline', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // Get all pending requests
    const requests = await new Promise((resolve, reject) => {
      const store = db.transaction('pending_requests', 'readonly').objectStore('pending_requests');
      const getAllRequest = store.getAll();
      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result;
        // Sort by priority and timestamp
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        items.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
        });
        resolve(items);
      };
    });

    if (requests.length === 0) {
      console.log('[SW] No pending requests to sync');
      return;
    }

    console.log(`[SW] Found ${requests.length} pending requests to sync`);

    // Sync each request
    let successful = 0;
    let failed = 0;

    for (const request of requests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: request.body ? JSON.parse(request.body) : undefined,
        });

        if (response.ok || response.status === 201) {
          // Remove from queue
          await new Promise((resolve, reject) => {
            const store = db.transaction('pending_requests', 'readwrite').objectStore('pending_requests');
            const deleteRequest = store.delete(request.id);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve(null);
          });
          successful++;
          console.log(`[SW] ✓ Synced ${request.method} ${request.url}`);
        } else {
          failed++;
          // Update retry count
          request.retries = (request.retries || 0) + 1;
          if (request.retries >= 5) {
            // Remove after 5 retries
            await new Promise((resolve, reject) => {
              const store = db.transaction('pending_requests', 'readwrite').objectStore('pending_requests');
              const deleteRequest = store.delete(request.id);
              deleteRequest.onerror = () => reject(deleteRequest.error);
              deleteRequest.onsuccess = () => resolve(null);
            });
            console.log(`[SW] ✗ Max retries for ${request.method} ${request.url}, removed`);
          } else {
            // Save updated retry count
            await new Promise((resolve, reject) => {
              const store = db.transaction('pending_requests', 'readwrite').objectStore('pending_requests');
              const putRequest = store.put(request);
              putRequest.onerror = () => reject(putRequest.error);
              putRequest.onsuccess = () => resolve(null);
            });
          }
          console.log(`[SW] ✗ Failed to sync ${request.method} ${request.url}, retries: ${request.retries}`);
        }
      } catch (error) {
        failed++;
        request.retries = (request.retries || 0) + 1;
        if (request.retries >= 5) {
          // Remove after 5 retries
          await new Promise((resolve, reject) => {
            const store = db.transaction('pending_requests', 'readwrite').objectStore('pending_requests');
            const deleteRequest = store.delete(request.id);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve(null);
          });
        } else {
          // Save updated retry count
          await new Promise((resolve, reject) => {
            const store = db.transaction('pending_requests', 'readwrite').objectStore('pending_requests');
            const putRequest = store.put(request);
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve(null);
          });
        }
        console.log(`[SW] Error syncing ${request.method} ${request.url}:`, error);
      }
    }

    console.log(`[SW] Background sync complete: ${successful} successful, ${failed} failed`);
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_SYNC_COMPLETE',
        successful,
        failed,
      });
    });

  } catch (error) {
    console.error('[SW] Error in background sync:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
