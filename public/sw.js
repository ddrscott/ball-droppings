const CACHE_NAME = 'ball-droppings-v3';
const urlsToCache = [
  '/'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/images/') || 
      url.pathname.startsWith('/audio/') || 
      url.pathname.startsWith('/music/') ||
      url.pathname.endsWith('.ttf')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request).catch(function() {
            // If fetch fails, return a basic response for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            // For other requests, just fail silently
            return new Response('', { status: 404 });
          });
        })
    );
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});