/**
 * BEATWAVE PRO - Offline PWA Service Worker
 * Proporciona persistencia de interfaz de cabina para iPad / Tablet / Móvil
 * Estrategia: Cache-First para assets estáticos, Network-Only para APIs y streaming de audio local.
 */

const CACHE_NAME = 'beatwave-pro-v2.7.0';

const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './css/tailwind.min.css',
  './css/fonts.css',
  './styles.css',
  './css/beatwave.css',
  './css/beatwave-ds.css',
  './vendor/react.min.js',
  './vendor/react-dom.min.js',
  './js/app.bundle.js',
  './js/transport_bridge.js',
  './assets/favicon.png',
  './assets/beatwave_wave_icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[BEATWAVE SW] Pre-cacheando assets de cabina offline...');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[BEATWAVE SW] Fallo no crítico precacheando algunos assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[BEATWAVE SW] Limpiando cache antigua:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Excluir llamadas de API, WebSockets y streaming de audio del caché
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws/') ||
    url.pathname.startsWith('/stream_audio') ||
    url.pathname.startsWith('/cover') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.flac')
  ) {
    return;
  }

  // Cache-First con fallback a red para la interfaz de usuario
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Fallback a index.html para navegación SPA
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
