/* OSIS SMA Al-Kahfi — React/Vite service worker v15 */
const VERSION = 'v15.0.0';
const STATIC_CACHE = `osis-static-${VERSION}`;
const RUNTIME_CACHE = `osis-runtime-${VERSION}`;
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './aspirasi-config.js',
  './gallery-config.js',
  './legacy/app.js',
  './images/bg-sekolah.webp',
  './images/logo-sekolah.png',
  './images/logo-osis-v36.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './sounds/startup.mp3',
  './sounds/tick.mp3',
  './sounds/unlock.wav',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CORE_ASSETS);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function staticFallback(request) {
  const staticCache = await caches.open(STATIC_CACHE);
  return staticCache.match(request);
}

async function networkFirst(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response?.ok && request.method === 'GET') await runtime.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await runtime.match(request) || await staticFallback(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await (await caches.open(STATIC_CACHE)).match('./');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const cached = await runtime.match(request) || await staticFallback(request);

  try {
    const response = await fetch(request);
    if (response?.ok) await runtime.put(request, response.clone());
    return cached || response;
  } catch (_) {
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(?:js|css|json)$/.test(url.pathname) || url.pathname.includes('/assets/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
