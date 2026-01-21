/**
 * useOnlineStatus
 *
 * Hook for detecting online/offline state.
 */

'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Get the current online status.
 */
function getOnlineStatus(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Subscribe to online/offline events.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Server snapshot (always online during SSR).
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Hook that returns the current online status.
 * Uses useSyncExternalStore for optimal performance.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getOnlineStatus, getServerSnapshot);
}

/**
 * Extended hook with additional offline utilities.
 */
export interface UseOnlineStatusExtendedReturn {
  /** Whether the user is currently online */
  isOnline: boolean;
  /** Whether the user is currently offline */
  isOffline: boolean;
  /** Timestamp of when the user went offline (null if online) */
  offlineSince: number | null;
  /** Duration in milliseconds the user has been offline */
  offlineDuration: number;
}

/**
 * Extended hook with offline duration tracking.
 */
export function useOnlineStatusExtended(): UseOnlineStatusExtendedReturn {
  const isOnline = useOnlineStatus();
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [offlineDuration, setOfflineDuration] = useState(0);

  // Track when we went offline
  useEffect(() => {
    if (!isOnline && offlineSince === null) {
      setOfflineSince(Date.now());
    } else if (isOnline) {
      setOfflineSince(null);
      setOfflineDuration(0);
    }
  }, [isOnline, offlineSince]);

  // Update duration while offline
  useEffect(() => {
    if (offlineSince === null) return;

    const interval = setInterval(() => {
      setOfflineDuration(Date.now() - offlineSince);
    }, 1000);

    return () => clearInterval(interval);
  }, [offlineSince]);

  return {
    isOnline,
    isOffline: !isOnline,
    offlineSince,
    offlineDuration,
  };
}
