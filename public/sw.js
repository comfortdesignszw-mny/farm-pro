// Farm Pro Service Worker - 100% Offline Standalone PWA Engine
const CACHE_NAME = 'farmpro-cache-v2';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// 1. Installation: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Farm Pro SW] Pre-caching core application shell');
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activation: Clean up stale caches and claim active clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Farm Pro SW] Removing obsolete cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch interceptor: Offline-First cache strategy with local sandboxing
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (e.g. POST to /api/farmchat)
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle SPA Navigation requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        // Return cached index.html immediately if available for 0ms offline startup
        if (cachedIndex) {
          // If online in background, update cache silently
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const copy = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
              }
            })
            .catch(() => {
              // Ignore background fetch error when offline
            });
          return cachedIndex;
        }

        // Otherwise fetch from network and cache
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return networkResponse;
        });
      }).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, SVGs, Fonts, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cache hit: return immediately without waiting for network
        // Stale-while-revalidate in background if online
        if (navigator.onLine) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
          }).catch(() => {
            // Offline - no action needed
          });
        }
        return cachedResponse;
      }

      // Cache miss: fetch from network, cache it for future offline starts, and return
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // If static asset fails offline, try fallback for navigation or ignore
        console.warn('[Farm Pro SW] Offline asset fetch failed:', event.request.url);
      });
    })
  );
});
