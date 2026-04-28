// linqme Service Worker -- cache-first for static assets ONLY
// Dashboard pages are dynamic and must never be cached.
const CACHE_NAME = "linqme-v2";

// Install: skip precaching dynamic routes — only cache on demand
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean up ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache static assets only — never cache HTML/RSC responses
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and API/auth routes
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/auth/")) return;

  // Static assets (fonts, images, CSS, JS bundles): cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // All other requests (HTML pages, RSC payloads, etc.): network only — no caching.
  // This prevents stale dashboard content and 404 caching issues.
});
