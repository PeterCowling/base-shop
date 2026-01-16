"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true; // Assume online during SSR
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface NetworkState {
  online: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
}

interface NetworkInformation extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

export function useNetworkState(): NetworkState {
  const online = useOnlineStatus();

  const [networkInfo, setNetworkInfo] = useState<Omit<NetworkState, "online">>({});

  useEffect(() => {
    const connection = navigator.connection;
    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    };

    updateNetworkInfo();
    connection.addEventListener("change", updateNetworkInfo);
    return () => connection.removeEventListener("change", updateNetworkInfo);
  }, []);

  return { online, ...networkInfo };
}

export function useOfflineReady(): {
  isOfflineReady: boolean;
  checkOfflineReady: () => Promise<boolean>;
} {
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  const checkOfflineReady = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const ready = registration.active !== null;
      setIsOfflineReady(ready);
      return ready;
    } catch {
      setIsOfflineReady(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkOfflineReady();
  }, [checkOfflineReady]);

  return { isOfflineReady, checkOfflineReady };
}
