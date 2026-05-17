const CACHE_NAME = 'estron-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Do not intercept non-GET requests (like PUT for Vercel Blob)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses (only basic/same-origin or cors, not opaque)
        if (response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
           if (cachedResponse) {
               return cachedResponse;
           }
           // Fallback if not in cache to avoid null response error
           return new Response('Network error and not found in cache', {
             status: 503,
             statusText: 'Service Unavailable'
           });
        });
      })
  );
});
