const CACHE_VERSION = 'v1';
const CACHE_NAME = `prime-arrival-shell-${CACHE_VERSION}`;
const ARRIVAL_SHELL_ASSETS = ['/', '/portal', '/offline'];

async function pruneLegacyArrivalCaches() {
  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith('prime-arrival-shell-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ARRIVAL_SHELL_ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await pruneLegacyArrivalCaches();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        await pruneLegacyArrivalCaches();

        try {
          const networkResponse = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse =
            (await cache.match(event.request)) ||
            (await cache.match('/portal')) ||
            (await cache.match('/offline'));
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })(),
    );
  }
});

self.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || typeof message.type !== 'string') {
    return;
  }

  if (message.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (message.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })(),
    );
    return;
  }

  if (message.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      (async () => {
        let usage = 0;
        const keys = await caches.keys();
        for (const key of keys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          usage += requests.length;
        }
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            size: {
              usage,
              quota: 0,
              usagePercent: '0',
            },
          });
        }
      })(),
    );
  }
});
