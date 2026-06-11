const CACHE_NAME = 'habit-tracker-v2';

// App shell — core files the app needs to work offline
const APP_SHELL = [
  '.',
  'index.html',
  'manifest.json',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
  'icons/icon-192-maskable.svg',
  'icons/icon-512-maskable.svg'
];

// Install: pre-cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_SHELL)
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean out old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell + fonts, network-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin + known CDNs
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isGoogleFontsCss = url.href.startsWith('https://fonts.googleapis.com/');

  // Cache-first for app shell and fonts
  if (isSameOrigin || isGoogleFontsCss || isGoogleFonts) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        // Return cached immediately, then update in background
        const fetchPromise = fetch(e.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
  // Network-first for everything else (fallback to cache)
  else {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
  }
});
