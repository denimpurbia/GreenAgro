/* =====================================================================
   GREENAGRO OFFICIAL PWA SERVICE WORKER (v1.0.0)
   Offline First + Stale-While-Revalidate Engine for Rural Agriculture
===================================================================== */

const CACHE_NAME_STATIC = 'greenagro-static-v1';
const CACHE_NAME_RUNTIME = 'greenagro-runtime-v1';
const CACHE_NAME_API = 'greenagro-api-v1';

const PRECACHE_URLS = [
  '/',
  '/app',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/images/greenagro-logo.png',
  '/images/farmer-hero.jpg'
];

// 1. Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[PWA SW] Pre-caching partial note:', err);
      });
    })
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('greenagro-') &&
              name !== CACHE_NAME_STATIC &&
              name !== CACHE_NAME_RUNTIME &&
              name !== CACHE_NAME_API
            );
          })
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Strategy:
// - Navigation requests: Network-first, fallback to cached App Shell ('/' or '/app')
// - Static build assets (/assets/*, fonts, images): Cache-first with background revalidation
// - API GET requests (/api/*): Network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET or cross-origin external analytics
  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // A. Navigation requests (farmer opening any route)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME_STATIC).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallbackApp = await caches.match('/app');
          if (fallbackApp) return fallbackApp;
          const fallbackRoot = await caches.match('/');
          if (fallbackRoot) return fallbackRoot;
          return new Response('GreenAgro Offline: Please reconnect to internet to refresh live farm telemetry.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // B. API telemetry requests: Network-first with cached fallback for offline field use
  if (url.pathname.startsWith('/api/')) {
    // Avoid caching auth tokens or login endpoints
    if (url.pathname.includes('/auth/') || url.pathname.includes('/login')) {
      return;
    }

    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME_API).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) {
            return cachedRes;
          }
          return new Response(JSON.stringify({ success: false, offline: true, error: 'Offline network condition' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // C. Static assets (JS, CSS, images, Web Fonts, Leaftlet tiles): Cache-first + background fetch
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME_RUNTIME).then((cache) => cache.put(req, resClone));
            }
            return networkRes;
          })
          .catch(() => null);

        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // D. Default fetch for all other requests
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// 4. Message Handler for updates & Skip Waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
