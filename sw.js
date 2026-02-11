const CACHE_NAME = 'readcard-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js',
  'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,300;0,7..72,400;0,7..72,500;1,7..72,300;1,7..72,400&family=DM+Sans:wght@400;500;600&display=swap'
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first for API calls, cache first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-only for API calls (Worker backend)
  if (url.pathname.includes('/extract') || url.pathname.includes('/analyze')) {
    return;
  }

  // Network first, fallback to cache for everything else
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(event.request, clone); } catch(e) {}
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
