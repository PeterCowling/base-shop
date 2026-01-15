/**
 * IndexedDB cache layer for Reception app offline data.
 * Provides persistent storage for Firebase data with graceful degradation.
 */

import { TIMESTAMP_KEY } from "../../constants/fields";

const DB_NAME = "reception-offline";
const DB_VERSION = 1;

interface CacheEntry<T = unknown> {
  path: string;
  data: T;
  timestamp: number;
}

type StoreName = "firebase-cache" | "pending-writes" | "meta";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for cached Firebase data
      if (!db.objectStoreNames.contains("firebase-cache")) {
        const store = db.createObjectStore("firebase-cache", { keyPath: "path" });
        store.createIndex(TIMESTAMP_KEY, TIMESTAMP_KEY, { unique: false });
      }

      // Store for pending write operations (offline mutations)
      if (!db.objectStoreNames.contains("pending-writes")) {
        const store = db.createObjectStore("pending-writes", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex(TIMESTAMP_KEY, TIMESTAMP_KEY, { unique: false });
        store.createIndex("path", "path", { unique: false });
      }

      // Store for metadata (version, sync timestamps)
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
  });

  return dbPromise;
}

async function getStore(
  storeName: StoreName,
  mode: IDBTransactionMode = "readonly"
): Promise<IDBObjectStore> {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Cache Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function getCachedData<T>(path: string): Promise<T | null> {
  try {
    const store = await getStore("firebase-cache");
    return new Promise((resolve, reject) => {
      const request = store.get(path);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        resolve(entry?.data ?? null);
      };
    });
  } catch {
    return null;
  }
}

export async function setCachedData<T>(path: string, data: T): Promise<boolean> {
  try {
    const store = await getStore("firebase-cache", "readwrite");
    const entry: CacheEntry<T> = {
      path,
      data,
      timestamp: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}

export async function deleteCachedData(path: string): Promise<boolean> {
  try {
    const store = await getStore("firebase-cache", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(path);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}

export async function clearOldCache(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const store = await getStore("firebase-cache", "readwrite");
    const cutoff = Date.now() - maxAgeMs;
    const index = store.index(TIMESTAMP_KEY);
    const range = IDBKeyRange.upperBound(cutoff);

    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch {
    // ignore errors during cleanup
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pending Writes (Offline Mutation Queue)
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingWrite {
  id?: number;
  path: string;
  operation: "set" | "update" | "remove";
  data?: unknown;
  timestamp: number;
}

export async function addPendingWrite(
  write: Omit<PendingWrite, "id" | typeof TIMESTAMP_KEY>
): Promise<number | null> {
  try {
    const store = await getStore("pending-writes", "readwrite");
    const entry: PendingWrite = {
      ...write,
      timestamp: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const request = store.add(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  } catch {
    return null;
  }
}

export async function getPendingWrites(): Promise<PendingWrite[]> {
  try {
    const store = await getStore("pending-writes");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as PendingWrite[]);
    });
  } catch {
    return [];
  }
}

export async function removePendingWrite(id: number): Promise<boolean> {
  try {
    const store = await getStore("pending-writes", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}

export async function clearPendingWrites(): Promise<boolean> {
  try {
    const store = await getStore("pending-writes", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}

export async function getPendingWriteCount(): Promise<number> {
  try {
    const store = await getStore("pending-writes");
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Meta Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function getMeta<T>(key: string): Promise<T | null> {
  try {
    const store = await getStore("meta");
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as { key: string; value: T } | undefined;
        resolve(entry?.value ?? null);
      };
    });
  } catch {
    return null;
  }
}

export async function setMeta<T>(key: string, value: T): Promise<boolean> {
  try {
    const store = await getStore("meta", "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Management
// ─────────────────────────────────────────────────────────────────────────────

export async function clearAllData(): Promise<boolean> {
  try {
    const db = await openDb();
    const storeNames: StoreName[] = ["firebase-cache", "pending-writes", "meta"];

    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}
