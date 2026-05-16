const CACHE_NAME = 'quran-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './baca.html',
  './profil.html',
  './index.css',
  './icon.svg',
  './manifest.json'
];

// Install Event - Caching core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate / Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  // Ignore external API calls (Aladhan, Alquran Cloud, BigDataCloud) so they always fetch fresh data if online
  if (event.request.url.includes('api.aladhan.com') || 
      event.request.url.includes('api.alquran.cloud') || 
      event.request.url.includes('api.bigdatacloud.net') ||
      event.request.url.includes('cdn.islamic.network')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch fresh version in background to update cache
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});
