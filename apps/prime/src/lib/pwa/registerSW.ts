/**
 * Service Worker Registration
 *
 * Registers the service worker and handles updates.
 */

/**
 * Check if service workers are supported.
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('[SW] New service worker available');
          dispatchUpdateEvent();
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[SW] Service worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

/**
 * Skip waiting and activate new service worker.
 */
export function skipWaiting(): void {
  if (!navigator.serviceWorker.controller) return;

  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Clear all service worker caches.
 */
export async function clearCache(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve(false);
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data?.success ?? false);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'CLEAR_CACHE' },
      [messageChannel.port2],
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Get cache size information.
 */
export async function getCacheSize(): Promise<{
  usage: number;
  quota: number;
  usagePercent: string;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data?.size ?? null);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2],
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Dispatch a custom event when SW update is available.
 */
function dispatchUpdateEvent(): void {
  window.dispatchEvent(new CustomEvent('sw-update-available'));
}

/**
 * Listen for service worker update events.
 */
export function onUpdateAvailable(callback: () => void): () => void {
  window.addEventListener('sw-update-available', callback);
  return () => window.removeEventListener('sw-update-available', callback);
}
