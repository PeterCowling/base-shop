import { type DBSchema,openDB } from "idb";

import type { XaProduct } from "../demoData";

export type XaSearchIndexJson = string;

type XaSearchCache = {
  version: string;
  syncedAt: number;
  products: XaProduct[];
  index: XaSearchIndexJson;
};

interface XaSearchDbSchema extends DBSchema {
  kv: {
    key: keyof XaSearchCache;
    value: XaSearchCache[keyof XaSearchCache];
  };
}

const DB_NAME = "xa-search";
const DB_VERSION = 1;

let memoryCache: Partial<XaSearchCache> = {};

async function getDb() {
  return openDB<XaSearchDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    },
  });
}

export async function readXaSearchCache(): Promise<Partial<XaSearchCache>> {
  try {
    const db = await getDb();
    const tx = db.transaction("kv", "readonly");
    const store = tx.objectStore("kv");
    const [version, syncedAt, products, index] = await Promise.all([
      store.get("version"),
      store.get("syncedAt"),
      store.get("products"),
      store.get("index"),
    ]);
    await tx.done;
    const next = {
      version: typeof version === "string" ? version : undefined,
      syncedAt: typeof syncedAt === "number" ? syncedAt : undefined,
      products: Array.isArray(products) ? (products as XaProduct[]) : undefined,
      index: typeof index === "string" && index ? index : undefined,
    };
    memoryCache = next;
    return next;
  } catch {
    return memoryCache;
  }
}

export async function writeXaSearchCache(next: Partial<XaSearchCache>) {
  memoryCache = { ...memoryCache, ...next };
  try {
    const db = await getDb();
    const tx = db.transaction("kv", "readwrite");
    const store = tx.objectStore("kv");
    const writes: Array<Promise<unknown>> = [];

    if (typeof next.version === "string") writes.push(store.put(next.version, "version"));
    if (typeof next.syncedAt === "number") writes.push(store.put(next.syncedAt, "syncedAt"));
    if (Array.isArray(next.products)) writes.push(store.put(next.products, "products"));
    if (typeof next.index === "string") writes.push(store.put(next.index, "index"));

    await Promise.all(writes);
    await tx.done;
  } catch {
    // Fallback to in-memory cache when IndexedDB is unavailable.
  }
}

export async function clearXaSearchCache() {
  memoryCache = {};
  try {
    const db = await getDb();
    const tx = db.transaction("kv", "readwrite");
    await tx.objectStore("kv").clear();
    await tx.done;
  } catch {
    // ignore storage failures
  }
}
