/**
 * useServiceWorker
 *
 * Hook for managing service worker registration and updates.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  clearCache,
  getCacheSize,
  isServiceWorkerSupported,
  onUpdateAvailable,
  registerServiceWorker,
  skipWaiting,
} from './registerSW';

interface UseServiceWorkerReturn {
  /** Whether service workers are supported */
  isSupported: boolean;
  /** Whether the service worker is registered */
  isRegistered: boolean;
  /** Whether a new version is available */
  updateAvailable: boolean;
  /** Apply the pending update */
  applyUpdate: () => void;
  /** Clear all cached data */
  clearCachedData: () => Promise<boolean>;
  /** Cache size info */
  cacheSize: { usage: number; quota: number; usagePercent: string } | null;
  /** Refresh cache size */
  refreshCacheSize: () => Promise<void>;
}

/**
 * Hook for service worker management.
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported] = useState(() => isServiceWorkerSupported());
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheSize, setCacheSize] = useState<{
    usage: number;
    quota: number;
    usagePercent: string;
  } | null>(null);

  // Register service worker on mount
  useEffect(() => {
    if (!isSupported) return;

    registerServiceWorker().then((registration) => {
      setIsRegistered(!!registration);
    });
  }, [isSupported]);

  // Listen for updates
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    return unsubscribe;
  }, [isSupported]);

  // Get initial cache size
  useEffect(() => {
    if (!isRegistered) return;

    getCacheSize().then(setCacheSize);
  }, [isRegistered]);

  const applyUpdate = () => {
    skipWaiting();
    window.location.reload();
  };

  const clearCachedData = async (): Promise<boolean> => {
    const success = await clearCache();
    if (success) {
      setCacheSize(null);
    }
    return success;
  };

  const refreshCacheSize = async (): Promise<void> => {
    const size = await getCacheSize();
    setCacheSize(size);
  };

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    applyUpdate,
    clearCachedData,
    cacheSize,
    refreshCacheSize,
  };
}
