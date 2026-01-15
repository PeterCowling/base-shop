/* Reception offline service worker (runtime caching) */

const VERSION = new URL(self.location.href).searchParams.get("v") || "v1";
const PREFIX = "reception-offline";

const ASSETS_CACHE = `${PREFIX}-assets-${VERSION}`;
const PAGES_CACHE = `${PREFIX}-pages-${VERSION}`;
const IMAGES_CACHE = `${PREFIX}-images-${VERSION}`;

const OFFLINE_FALLBACK_URL = "/offline.html";

const MAX_IMAGE_ENTRIES = 80;
const MAX_PAGE_ENTRIES = 30;

// Precache key operational pages
const PRECACHE_ROUTES = ["/", "/bar", "/checkin", "/checkout", "/rooms-grid"];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isHtmlRequest(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isNextImage(url) {
  return url.pathname.startsWith("/_next/image");
}

// Skip caching Firebase API requests - they could become stale
function isFirebaseRequest(url) {
  return (
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firebase")
  );
}

async function cacheFirst(request, cacheName, { allowOpaque = false } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok || (allowOpaque && res.type === "opaque")) {
    await cache.put(request, res.clone());
  }
  return res;
}

async function networkFirst(request, cacheName, { fallbackUrl, maxEntries, allowOpaque = false } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok || (allowOpaque && res.type === "opaque")) {
      await cache.put(request, res.clone());
      if (maxEntries) await pruneCache(cacheName, maxEntries);
    }
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request, cacheName, { allowOpaque = false } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(async (res) => {
      if (res.ok || (allowOpaque && res.type === "opaque")) {
        await cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);

  if (cached) return cached;
  const fresh = await fetchPromise;
  if (fresh) return fresh;
  throw new Error("offline");
}

async function pruneCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map((key) => cache.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(ASSETS_CACHE);
      await cache.addAll([OFFLINE_FALLBACK_URL]);

      const pages = await caches.open(PAGES_CACHE);
      await Promise.all(
        PRECACHE_ROUTES.map(async (path) => {
          try {
            const req = new Request(path, { cache: "reload" });
            const res = await fetch(req);
            if (res.ok) await pages.put(req, res);
          } catch {
            // Best-effort precache; offline install is fine.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([ASSETS_CACHE, PAGES_CACHE, IMAGES_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(PREFIX) && !keep.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = isSameOrigin(url);

  // Never cache Firebase requests - they need fresh data
  if (isFirebaseRequest(url)) {
    return;
  }

  if (sameOrigin) {
    // Cache Next.js static assets with cache-first strategy
    if (isNextStaticAsset(url)) {
      event.respondWith(cacheFirst(request, ASSETS_CACHE));
      return;
    }

    // Cache Next.js optimized images
    if (isNextImage(url)) {
      event.respondWith(
        cacheFirst(request, IMAGES_CACHE).finally(() => pruneCache(IMAGES_CACHE, MAX_IMAGE_ENTRIES)),
      );
      return;
    }
  }

  // Cache external images with stale-while-revalidate
  if (request.destination === "image") {
    event.respondWith(
      staleWhileRevalidate(request, IMAGES_CACHE, { allowOpaque: !sameOrigin }).finally(() =>
        pruneCache(IMAGES_CACHE, MAX_IMAGE_ENTRIES),
      ),
    );
    return;
  }

  // Network-first for HTML pages with offline fallback
  if (isHtmlRequest(request)) {
    event.respondWith(
      networkFirst(request, PAGES_CACHE, {
        fallbackUrl: OFFLINE_FALLBACK_URL,
        maxEntries: MAX_PAGE_ENTRIES,
      }),
    );
    return;
  }

  // Cache scripts, styles, and fonts with cache-first
  if (request.destination === "script" || request.destination === "style" || request.destination === "font") {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  // Stale-while-revalidate for other Next.js assets
  if (sameOrigin && url.pathname.startsWith("/_next/")) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
});
