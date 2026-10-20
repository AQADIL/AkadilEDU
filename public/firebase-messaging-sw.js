self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }
  const notification = payload.notification;
  if (!notification?.title) return;
  event.waitUntil(self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.fcmOptions?.link || payload.data?.url || '/' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    let target = new URL('/', self.location.origin);
    try {
      const requested = new URL(event.notification.data?.url || '/', self.location.origin);
      if (requested.origin === self.location.origin) target = requested;
    } catch {}
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => client.url === target.href);
    return existing ? existing.focus() : self.clients.openWindow(target.href);
  })());
});
