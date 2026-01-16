/**
 * Prime Guest Portal Service Worker
 *
 * Provides offline support with appropriate caching strategies:
 * - Static assets: cache-first
 * - API calls: network-first with fallback
 * - Images: cache with expiry
 *
 * Security: Only caches non-sensitive data
 */

const CACHE_VERSION = 'prime-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets to precache (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/find-my-stay',
  '/offline',
];

// Cache expiry times
const CACHE_EXPIRY = {
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 5 * 60 * 1000, // 5 minutes
};

// Paths that should NEVER be cached (sensitive data)
const NEVER_CACHE_PATTERNS = [
  /\/api\/firebase/,
  /\/api\/find-booking/,
  /\/api\/check-in-lookup/,
  /guestsDetails/,
  /bookings\//,
  /preArrival\//,
  /cityTax\//,
  /financials\//,
];

/**
 * Check if a URL should never be cached.
 */
function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if a request is for an image.
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)
  );
}

/**
 * Check if a request is for a static asset.
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    /\.(js|css|woff2?|ttf|eot)$/i.test(url.pathname)
  );
}

/**
 * Install event - precache static assets.
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activate immediately
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches.
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('prime-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle requests with appropriate strategies.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache sensitive data
  if (shouldNeverCache(request.url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: cache with expiry
  if (isImageRequest(request)) {
    event.respondWith(cacheWithExpiry(request, IMAGE_CACHE, CACHE_EXPIRY.images));
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Other requests: network-first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/**
 * Cache-first strategy.
 * Returns cached response if available, otherwise fetches from network.
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    throw error;
  }
}

/**
 * Network-first strategy.
 * Tries network first, falls back to cache.
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network-first with offline page fallback for navigation.
 */
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort: return a basic offline response
    return new Response(
      '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
      {
        headers: { 'Content-Type': 'text/html' },
        status: 503,
      }
    );
  }
}

/**
 * Cache with expiry strategy.
 * Caches responses with a timestamp, refreshes if expired.
 */
async function cacheWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cachedTime = cachedResponse.headers.get('sw-cached-time');
    if (cachedTime && Date.now() - parseInt(cachedTime, 10) < maxAge) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and add timestamp header
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-time', Date.now().toString());

      const responseWithTime = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });

      cache.put(request, responseWithTime);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Message handler for cache management.
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0]?.postMessage({ size });
      });
      break;

    default:
      break;
  }
});

/**
 * Clear all caches.
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('prime-'))
      .map((name) => caches.delete(name))
  );
  console.log('[SW] All caches cleared');
}

/**
 * Get approximate cache size.
 */
async function getCacheSize() {
  if (!navigator.storage?.estimate) {
    return null;
  }
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage,
    quota: estimate.quota,
    usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2),
  };
}
