"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Database } from "firebase/database";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncPendingWrites, type SyncResult } from "./syncManager";
import { getPendingWriteCount } from "./receptionDb";

export interface UseOfflineSyncOptions {
  database: Database | null;
  autoSync?: boolean;
  onSyncComplete?: (result: SyncResult) => void;
}

export interface UseOfflineSyncReturn {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSyncResult: SyncResult | null;
  triggerSync: () => Promise<SyncResult | null>;
}

export function useOfflineSync({
  database,
  autoSync = true,
  onSyncComplete,
}: UseOfflineSyncOptions): UseOfflineSyncReturn {
  const online = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const wasOffline = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingWriteCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async (): Promise<SyncResult | null> => {
    if (!database || !online || syncing) return null;

    setSyncing(true);
    try {
      const result = await syncPendingWrites(database);
      setLastSyncResult(result);
      await refreshPendingCount();
      onSyncComplete?.(result);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [database, online, syncing, refreshPendingCount, onSyncComplete]);

  // Track offline->online transitions
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current && autoSync && database) {
      wasOffline.current = false;
      triggerSync();
    }
  }, [online, autoSync, database, triggerSync]);

  // Poll pending count
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  return {
    online,
    pendingCount,
    syncing,
    lastSyncResult,
    triggerSync,
  };
}
