// Storage utilities
export { clearPrefix,getLocalStorage, readJson, removeItem, writeJson } from "./storage";

// IndexedDB operations
export {
  addPendingWrite,
  clearAllData,
  clearOldCache,
  clearPendingWrites,
  deleteCachedData,
  getCachedData,
  getMeta,
  getPendingWriteCount,
  getPendingWrites,
  isIndexedDbAvailable,
  type PendingWrite,
  removePendingWrite,
  setCachedData,
  setMeta,
} from "./receptionDb";

// Sync manager
export {
  isSyncing,
  queueOfflineWrite,
  syncPendingWrites,
  type SyncResult,
} from "./syncManager";

// Hooks
export { useOfflineSync, type UseOfflineSyncOptions, type UseOfflineSyncReturn } from "./useOfflineSync";
export { useNetworkState, useOfflineReady,useOnlineStatus } from "./useOnlineStatus";
