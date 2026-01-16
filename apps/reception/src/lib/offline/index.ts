// Storage utilities
export { getLocalStorage, readJson, writeJson, removeItem, clearPrefix } from "./storage";

// IndexedDB operations
export {
  getCachedData,
  setCachedData,
  deleteCachedData,
  clearOldCache,
  addPendingWrite,
  getPendingWrites,
  removePendingWrite,
  clearPendingWrites,
  getPendingWriteCount,
  getMeta,
  setMeta,
  clearAllData,
  isIndexedDbAvailable,
  type PendingWrite,
} from "./receptionDb";

// Sync manager
export {
  syncPendingWrites,
  queueOfflineWrite,
  isSyncing,
  type SyncResult,
} from "./syncManager";

// Hooks
export { useOnlineStatus, useNetworkState, useOfflineReady } from "./useOnlineStatus";
export { useOfflineSync, type UseOfflineSyncOptions, type UseOfflineSyncReturn } from "./useOfflineSync";
