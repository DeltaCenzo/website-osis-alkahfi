const CACHE_NAME = 'osis-alkahfi-pwa-v17-clean';
const CORE_ASSETS = [
  './', './index.html', './404.html', './manifest.webmanifest', './gallery-config.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi: utamakan jaringan agar 404 dari hosting tetap tampil benar.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const isHome = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
          if (response.ok && isHome) {
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const home = await caches.match('./index.html');
          return home || caches.match('./404.html');
        })
    );
    return;
  }

  // Config galeri harus mengambil versi jaringan terbaru jika tersedia.
  if (url.pathname.endsWith('/gallery-config.js')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response && response.status === 200) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
