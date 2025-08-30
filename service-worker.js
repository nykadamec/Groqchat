const CACHE_NAME = 'groqchat-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/main.js',
  '/js/modules/config.js',
  '/js/modules/i18n.js',
  '/js/modules/settings.js',
  '/js/modules/groq.js',
  '/js/modules/chat.js',
  '/js/modules/ui.js',
  '/js/modules/pwa.js',
  '/style/style.css',
  '/locales/cs.json',
  '/locales/en.json',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});