"use client";

import { memo } from "react";
import { Wifi } from "lucide-react";

import { useOfflineSyncContext } from "../context/OfflineSyncContext";

/**
 * Displays a banner when the app is offline or when sync state requires attention.
 * Shows pending write count while offline, syncing progress, and failed-write errors.
 */
function OfflineIndicator() {
  const { online, pendingCount, syncing, lastSyncResult, triggerSync } =
    useOfflineSyncContext();

  // Online and no sync issues — hide banner
  if (online && !syncing && (!lastSyncResult || lastSyncResult.failed === 0)) {
    return null;
  }

  // Sync failed — show retry prompt
  if (online && lastSyncResult && lastSyncResult.failed > 0) {
    const { failed } = lastSyncResult;
    return (
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-primary-fg shadow-md">
        <Wifi className="h-4 w-4" />
        <span>
          Sync failed: {failed} write{failed === 1 ? "" : "s"} could not be
          saved.
        </span>
        <button
          onClick={() => void triggerSync()}
          className="ml-2 underline underline-offset-2"
        >
          Retry?
        </button>
      </div>
    );
  }

  // Online and syncing in progress
  if (online && syncing) {
    return (
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-primary-fg shadow-md">
        <Wifi className="h-4 w-4" />
        <span>Syncing…</span>
      </div>
    );
  }

  // Offline — show queued write count if any, otherwise generic message
  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-primary-fg shadow-md">
      <Wifi className="h-4 w-4" />
      {pendingCount > 0 ? (
        <span>
          You&apos;re offline. {pendingCount} write
          {pendingCount === 1 ? "" : "s"} queued.
        </span>
      ) : (
        <span>You&apos;re offline.</span>
      )}
    </div>
  );
}

export default memo(OfflineIndicator);
