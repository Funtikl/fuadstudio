// v7 — lossless PNG preview, toBlob export, img.decode(), buffer pool
const CACHE_NAME = 'fuads-studio-v7';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Delete every old cache unconditionally
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache — always go to network
  // Vite already content-hashes all JS/CSS assets, so no caching needed
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
