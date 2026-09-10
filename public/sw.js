// Minimal Progressive Web App Service Worker with Share Target support
const CACHE_NAME = 'downloader-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch requests
  // If handling POST share_target, this is where multipart form data would be intercepted
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || new Response('Offline', { status: 503 });
    })
  );
});
