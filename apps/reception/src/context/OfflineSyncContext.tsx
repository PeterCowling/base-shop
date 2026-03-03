/* src/context/OfflineSyncContext.tsx */
"use client";

import React, { useContext } from "react";

import type { UseOfflineSyncReturn } from "../lib/offline/useOfflineSync";

export type OfflineSyncContextValue = UseOfflineSyncReturn;

const defaultValue: OfflineSyncContextValue = {
  online: true,
  pendingCount: 0,
  syncing: false,
  lastSyncResult: null,
  triggerSync: async () => null,
};

export const OfflineSyncContext =
  React.createContext<OfflineSyncContextValue>(defaultValue);

export function useOfflineSyncContext(): OfflineSyncContextValue {
  return useContext(OfflineSyncContext);
}
