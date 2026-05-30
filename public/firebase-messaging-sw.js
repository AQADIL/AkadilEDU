// Combined Service Worker: PWA + FCM Push Notifications
const CACHE_NAME = 'akadiledu-v2.4.0';
const urlsToCache = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ============ FIREBASE CLOUD MESSAGING ============
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBqKkucrcXnCWsC07w3DwvPkBbhI9XJKIE",
  authDomain: "akadiledu.firebaseapp.com",
  databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "akadiledu",
  storageBucket: "akadiledu.appspot.com",
  messagingSenderId: "78627994035",
  appId: "1:78627994035:web:eb93f14c26e6c9d96273c6"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('\ud83d\udcf1 [SW] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'AkadilEDU';
  const notificationOptions = {
    body: payload.notification?.body || 'Новое уведомление',
    icon: payload.notification?.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // Большое изображение для rich уведомлений
    image: payload.notification?.image || payload.data?.image,
    // Агрессивная вибрация
    vibrate: [200, 100, 200, 100, 200],
    // Уведомление висит, пока пользователь не взаимодействует
    requireInteraction: true,
    // Постоянный тег для обновления одного уведомления
    tag: 'akadiledu-urgent',
    renotify: true,
    data: {
      ...(payload.data || {}),
      // Best-effort канал для Android (если браузер поддерживает)
      channelId: 'high_importance_channel'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============ PWA CACHING ============

// Install service worker
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ [SW] Cache opened');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activated');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('🗑️ [SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch handler with caching
self.addEventListener('fetch', (event) => {
  // Skip non-http(s) requests
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

  // Don't cache dynamic JS/CSS chunks
  const url = new URL(event.request.url);
  if (url.pathname.match(/\.(js|css|map)$/)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

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
        return new Response('Network error', { status: 408 });
      });
    })
  );
});

// ============ PUSH EVENT HANDLER (for browsers that don't use FCM directly) ============
// NOTE: This is a fallback. FCM handles most push events via onBackgroundMessage above.
// We skip this to prevent duplicates since FCM already handles it.
self.addEventListener('push', (event) => {
  console.log('📱 [SW] Push event received (skipping - FCM handles this)');
  // Don't show notification here - FCM's onBackgroundMessage already does it
  // This prevents duplicate notifications
});

// ============ NOTIFICATION CLICK HANDLER ============
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ [SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
