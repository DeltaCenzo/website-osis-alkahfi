/* OSIS SMA Al-Kahfi - Service Worker */
const VERSION = "v47"; // motion/performance build V24
const STATIC_CACHE = `osis-alkahfi-pwa-static-${VERSION}`;
const RUNTIME_CACHE = `osis-alkahfi-pwa-runtime-${VERSION}`;

// Asset inti yang harus selalu tersedia offline
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./app-version.json",
  "./css/base.css",
  "./css/content.css",
  "./css/dashboard.css",
  "./css/responsive.css",
  "./css/gallery.css",
  "./css/polish.css",
  "./css/motion.css",
  "./css/performance.css",
  "./js/core.js",
  "./js/motion.js",
  "./js/aspirasi.js",
  "./js/push.js",
  "./js/gallery.js",
  "./js/countdown.js",
  "./js/announcements.js",
  "./js/dashboard.js",
  "./js/pwa.js",
  "./js/ui.js",
  "./js/bootstrap.js",
  "./aspirasi-config.js",
  "./images/bg-sekolah.webp",
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
    const cachedHome = await cache.match("./index.html");
    if (cachedHome) return cachedHome;
    const cached404 = await cache.match("./404.html");
    return cached404 || new Response("Offline", { status: 503 });
  }
}

// Network-first untuk file konfigurasi agar URL backend selalu terbaru,
// tetapi tetap fallback ke cache saat offline.
async function handleConfig(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    return (
      cached ||
      (await caches.open(STATIC_CACHE)).match(request)
    );
  }
}

// Network-first untuk kode UI agar setiap reload langsung memakai versi terbaru.
// Cache hanya dipakai saat jaringan tidak tersedia.
async function handleFreshAsset(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.status === 200) {
      runtimeCache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (await runtimeCache.match(request)) ||
      (await caches.open(STATIC_CACHE)).match(request);

    if (cached) return cached;
    throw error;
  }
}

// Asset non-kritis tetap memakai cache cepat.
async function handleAsset(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const cached = await runtimeCache.match(request);

  if (cached) {
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          runtimeCache.put(request, response.clone());
        }
      })
      .catch(() => {});
    return cached;
  }

  const response = await fetch(request);
  if (response && response.status === 200) {
    runtimeCache.put(request, response.clone());
  }
  return response;
}


// Cache-first untuk gambar statis.
// Gambar yang sudah pernah dimuat tidak perlu terus mengambil ulang dari jaringan.
async function handleImageRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Hanya GET
  if (request.method !== "GET") return;
  if (!isSameOrigin(request)) return;

  const url = new URL(request.url);

  // Penanda build selalu diambil langsung dari jaringan.
  // File ini dipolling oleh pwa.js agar perangkat yang masih membuka aplikasi
  // bisa reload otomatis ketika deployment baru tersedia.
  if (url.pathname.endsWith("/app-version.json")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.open(STATIC_CACHE).then((cache) => cache.match("./app-version.json"))
      )
    );
    return;
  }

  // Navigation request (browser pindah halaman)
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Gambar memakai cache-first agar navigasi ulang terasa lebih cepat.
  if (request.destination === "image") {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // File konfigurasi selalu mencoba versi jaringan terlebih dahulu.
  if (
    url.pathname.endsWith("/gallery-config.js") ||
    url.pathname.endsWith("/aspirasi-config.js")
  ) {
    event.respondWith(handleConfig(request));
    return;
  }

  // JavaScript/CSS selalu mencoba jaringan lebih dulu agar deployment baru
  // langsung terlihat setelah auto-refresh.
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(handleFreshAsset(request));
    return;
  }

  // Untuk asset/statik lainnya
  event.respondWith(handleAsset(request));
});