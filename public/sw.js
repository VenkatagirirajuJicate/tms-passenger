// Service Worker for Push Notifications
const CACHE_NAME = 'tms-passenger-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/notifications',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event handler
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.title = payload.title || 'TMS Notification';
      options.icon = payload.icon || options.icon;
      options.data = payload.data || options.data;
      
      if (payload.url) {
        options.data.url = payload.url;
      }
    } catch (e) {
      console.error('Error parsing push payload:', e);
      options.title = 'TMS Notification';
    }
  } else {
    options.title = 'TMS Notification';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app or navigate to specific page
    const urlToOpen = event.notification.data?.url || '/dashboard/notifications';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes('/dashboard') && 'focus' in client) {
              client.focus();
              client.navigate(urlToOpen);
              return;
            }
          }
          // If app is not open, open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'close') {
    // Just close the notification (already handled above)
    return;
  } else {
    // Default action - open app
    const urlToOpen = event.notification.data?.url || '/dashboard/notifications';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes('/dashboard') && 'focus' in client) {
              client.focus();
              client.navigate(urlToOpen);
              return;
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync (for offline functionality)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      fetch('/api/sync')
        .then((response) => {
          console.log('Background sync completed');
        })
        .catch((error) => {
          console.error('Background sync failed:', error);
        })
    );
  }
}); 