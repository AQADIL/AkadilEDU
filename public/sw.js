const CACHE_NAME = 'akadiledu-v2.2.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Cache opened');
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  // Skip non-http(s) requests (chrome-extension, etc)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Don't cache API requests or Firebase requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('firestore') ||
      event.request.url.includes('firebasestorage')) {
    return;
  }

  // Don't cache dynamic JS/CSS chunks from Vite
  const url = new URL(event.request.url);
  if (url.pathname.match(/\.(js|css|map)$/)) {
    // Always fetch fresh JS/CSS files to avoid MIME type issues
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Only cache images, fonts, and static assets
        const contentType = response.headers.get('content-type');
        if (contentType && (
          contentType.includes('image/') ||
          contentType.includes('font/') ||
          contentType.includes('woff')
        )) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Return a fallback response if fetch fails
        return new Response('Network error', { status: 408 });
      });
    })
  );
});

// Update service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});
