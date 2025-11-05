// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBqKkucrcXnCWsC07w3DwvPkBbhI9XJKIE",
  authDomain: "akadiledu.firebaseapp.com",
  databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "akadiledu",
  storageBucket: "akadiledu.firebasestorage.app",
  messagingSenderId: "78627994035",
  appId: "1:78627994035:web:eb93f14c26e6c9d96273c6"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'AkadilEDU';
  const notificationOptions = {
    body: payload.notification?.body || 'Новое уведомление',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked');
  event.notification.close();
  
  // Open the app
  event.waitUntil(
    clients.openWindow('/')
  );
});
