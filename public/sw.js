const CACHE_NAME = 'ball-droppings-v4';
const urlsToCache = [
  '/',
  '/edit'
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
  
  // Cache-first strategy for static assets (they don't change often)
  if (url.pathname.startsWith('/images/') || 
      url.pathname.startsWith('/audio/') || 
      url.pathname.startsWith('/music/') ||
      url.pathname.endsWith('.ttf')) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(function(response) {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            });
        })
    );
  } else {
    // Network-first strategy for app code (ensures updates when online)
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
          // If network fails, try cache
          return caches.match(event.request)
            .then(function(response) {
              if (response) {
                return response;
              }
              // If no cache and it's a navigation request, return cached home page
              if (event.request.mode === 'navigate') {
                return caches.match('/');
              }
              // For other requests, return a 404
              return new Response('', { status: 404 });
            });
        })
    );
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});