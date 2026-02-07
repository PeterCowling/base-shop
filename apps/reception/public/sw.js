// Reception Service Worker
// Provides offline-first caching for the reception app.

const CACHE_NAME = "reception-v1";
const OFFLINE_URL = "/offline.html";

// Key routes to precache on install
const PRECACHE_URLS = [
  "/",
  "/bar",
  "/checkin",
  "/checkout",
  "/rooms-grid",
  OFFLINE_URL,
];

// Domains to never cache (Firebase, analytics, etc.)
const EXCLUDED_HOSTS = [
  "firebaseio.com",
  "googleapis.com",
  "firebaseapp.com",
  "google-analytics.com",
  "googletagmanager.com",
];

function isExcluded(url) {
  const hostname = new URL(url).hostname;
  return EXCLUDED_HOSTS.some((h) => hostname.includes(h));
}

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|eot)(\?|$)/.test(url);
}

function isImage(url) {
  return /\.(png|jpe?g|gif|svg|webp|ico|avif)(\?|$)/.test(url);
}

// Install: precache key routes and offline fallback
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: apply caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Never cache Firebase or analytics requests
  if (isExcluded(request.url)) return;

  if (isNavigationRequest(request)) {
    // Network-first for HTML pages, fallback to cache, then offline page
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  if (isStaticAsset(request.url)) {
    // Cache-first for static assets (JS, CSS, fonts)
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  if (isImage(request.url)) {
    // Stale-while-revalidate for images
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }
});
