// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[firebase-messaging-sw.js] Service Worker loaded');

let messaging = null;

// Function to initialize Firebase
function initializeFirebaseMessaging(config) {
  console.log('[firebase-messaging-sw.js] Initializing Firebase');
  
  firebase.initializeApp(config);
  messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'SocietyHub Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: payload.data?.type || 'default',
      data: {
        url: payload.data?.url || '/',
        type: payload.data?.type || 'default',
        ...payload.data
      },
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/pwa-64x64.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/pwa-64x64.png'
        }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Try to load config from Firebase Hosting (production)
fetch('/__/firebase/init.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Not on Firebase Hosting');
    }
    return response.json();
  })
  .then(config => {
    console.log('[firebase-messaging-sw.js] Using Firebase Hosting config');
    initializeFirebaseMessaging(config);
  })
  .catch(() => {
    // Fallback: Try to load local config for development
    console.log('[firebase-messaging-sw.js] Attempting to load local config');
    
    fetch('/firebase-config-local.js')
      .then(response => response.text())
      .then(scriptText => {
        eval(scriptText);
        if (self.firebaseConfigLocal) {
          console.log('[firebase-messaging-sw.js] Using local config');
          initializeFirebaseMessaging(self.firebaseConfigLocal);
        } else {
          throw new Error('Local config not found');
        }
      })
      .catch(error => {
        console.error('[firebase-messaging-sw.js] Failed to load Firebase config:', error);
      });
  });

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed');
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});