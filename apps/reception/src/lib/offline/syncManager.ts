/**
 * Sync manager for processing pending offline writes when back online.
 * Handles Firebase mutations queued while offline.
 */

import type { Database } from "firebase/database";
import { ref, remove, set, update } from "firebase/database";

import { sendGuestEmailDraftRequest } from "../../services/useEmailGuest";

import {
  addPendingWrite,
  getPendingWrites,
  type PendingWrite,
  removePendingWrite,
} from "./receptionDb";

export const GUEST_EMAIL_DRAFT_OPERATION = "email_guest_draft";

export interface QueuedGuestEmailDraft {
  bookingRef: string;
  activityCode: number;
}

function isQueuedGuestEmailDraft(data: unknown): data is QueuedGuestEmailDraft {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.bookingRef === "string" &&
    candidate.bookingRef.trim().length > 0 &&
    typeof candidate.activityCode === "number" &&
    Number.isInteger(candidate.activityCode)
  );
}

function isDuplicateGuestEmailDraft(
  pendingWrites: PendingWrite[],
  payload: QueuedGuestEmailDraft
): boolean {
  return pendingWrites.some((write) => {
    if (write.operation !== GUEST_EMAIL_DRAFT_OPERATION) return false;
    if (!isQueuedGuestEmailDraft(write.data)) return false;
    return (
      write.data.bookingRef === payload.bookingRef &&
      write.data.activityCode === payload.activityCode
    );
  });
}

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
        switch (write.operation) {
          case "set": {
            const dbRef = ref(database, write.path);
            await set(dbRef, write.data);
            break;
          }
          case "update": {
            const dbRef = ref(database, write.path);
            await update(dbRef, write.data as Record<string, unknown>);
            break;
          }
          case "remove": {
            const dbRef = ref(database, write.path);
            await remove(dbRef);
            break;
          }
          case GUEST_EMAIL_DRAFT_OPERATION: {
            if (!isQueuedGuestEmailDraft(write.data)) {
              throw new Error("Invalid queued guest email draft payload");
            }
            const emailResult = await sendGuestEmailDraftRequest({
              bookingRef: write.data.bookingRef,
              activityCode: write.data.activityCode,
            });
            if (!emailResult.success) {
              throw new Error(
                emailResult.error || "Failed to process queued guest email draft"
              );
            }
            break;
          }
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
  operation: "set" | "update" | "remove" | "email_guest_draft",
  data?: unknown,
  opts?: {
    idempotencyKey?: string;
    conflictPolicy?: "last-write-wins" | "fail-on-conflict";
    atomic?: boolean;
    domain?: string;
  }
): Promise<number | null> {
  return addPendingWrite({ path, operation, data, ...opts });
}

export async function queueGuestEmailDraftRetry(
  payload: QueuedGuestEmailDraft
): Promise<number | null> {
  const normalizedPayload: QueuedGuestEmailDraft = {
    bookingRef: payload.bookingRef.trim(),
    activityCode: payload.activityCode,
  };

  const pendingWrites = await getPendingWrites();
  if (isDuplicateGuestEmailDraft(pendingWrites, normalizedPayload)) {
    return 0;
  }

  return addPendingWrite({
    path: "",
    operation: GUEST_EMAIL_DRAFT_OPERATION,
    data: normalizedPayload,
    idempotencyKey: `guest-email:${normalizedPayload.bookingRef}:${normalizedPayload.activityCode}`,
    domain: "guest-email",
  });
}

export function isSyncing(): boolean {
  return syncInProgress;
}
