/* OSIS SMA Al-Kahfi - Service Worker */
const VERSION = "v19"; // naikkan saat deploy perubahan
const STATIC_CACHE = `osis-alkahfi-pwa-static-${VERSION}`;
const RUNTIME_CACHE = `osis-alkahfi-pwa-runtime-${VERSION}`;

// Asset inti yang harus selalu tersedia offline
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./gallery-config.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Utility: cek request berasal dari origin yang sama
function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // Cache asset inti
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(CORE_ASSETS);
      // Langsung aktif untuk dev/update yang cepat
      self.skipWaiting?.();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );

      // Ambil alih kontrol halaman
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Strategi untuk navigation:
// - online: fetch, jika gagal -> fallback 404.html
// - offline: langsung tampil 404.html (sesuai kebutuhan kamu)
async function handleNavigation(request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(request);
    // Update index offline kalau requestnya root/home
    const isHome =
      url.pathname === "/" ||
      url.pathname.endsWith("/index.html");

    if (response && response.ok && isHome) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put("./index.html", response.clone());
    }

    return response;
  } catch (err) {
    const cache = await caches.open(STATIC_CACHE);
    const cached404 = await cache.match("./404.html");
    return cached404 || new Response("404 - Offline", { status: 404 });
  }
}

// Network-first untuk gallery-config.js agar selalu latest,
// tapi fallback cache bila putus internet.
async function handleGalleryConfig(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    return (
      cached ||
      (await caches.open(STATIC_CACHE)).match("./gallery-config.js")
    );
  }
}

// Cache-first + update (stale cached response cepat)
async function handleAsset(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  const cached = await runtimeCache.match(request);
  const network = fetch(request).then((response) => {
    // hanya simpan sukses
    if (response && response.status === 200) {
      runtimeCache.put(request, response.clone());
    }
    return response;
  });

  // kalau ada cached, balikin dulu; kalau tidak ada, tunggu network
  if (cached) return cached;
  return network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Hanya GET
  if (request.method !== "GET") return;
  if (!isSameOrigin(request)) return;

  const url = new URL(request.url);

  // Navigation request (browser pindah halaman)
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Pastikan gallery-config selalu ambil versi terbaru
  if (url.pathname.endsWith("/gallery-config.js")) {
    event.respondWith(handleGalleryConfig(request));
    return;
  }

  // Untuk asset/statik lainnya
  event.respondWith(handleAsset(request));
});