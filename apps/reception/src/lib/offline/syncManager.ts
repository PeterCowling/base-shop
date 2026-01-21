/**
 * Sync manager for processing pending offline writes when back online.
 * Handles Firebase mutations queued while offline.
 */

import { ref, set, update, remove } from "firebase/database";
import type { Database } from "firebase/database";
import {
  getPendingWrites,
  removePendingWrite,
  addPendingWrite,
  type PendingWrite,
} from "./receptionDb";

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ write: PendingWrite; error: unknown }>;
}

let syncInProgress = false;

export async function syncPendingWrites(database: Database): Promise<SyncResult> {
  if (syncInProgress) {
    return { success: false, processed: 0, failed: 0, errors: [] };
  }

  syncInProgress = true;
  const result: SyncResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: [],
  };

  try {
    const pendingWrites = await getPendingWrites();

    for (const write of pendingWrites) {
      try {
        const dbRef = ref(database, write.path);

        switch (write.operation) {
          case "set":
            await set(dbRef, write.data);
            break;
          case "update":
            await update(dbRef, write.data as Record<string, unknown>);
            break;
          case "remove":
            await remove(dbRef);
            break;
        }

        if (write.id !== undefined) {
          await removePendingWrite(write.id);
        }
        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({ write, error });
      }
    }

    result.success = result.failed === 0;
  } finally {
    syncInProgress = false;
  }

  return result;
}

export function queueOfflineWrite(
  path: string,
  operation: "set" | "update" | "remove",
  data?: unknown
): Promise<number | null> {
  return addPendingWrite({ path, operation, data });
}

export function isSyncing(): boolean {
  return syncInProgress;
}
