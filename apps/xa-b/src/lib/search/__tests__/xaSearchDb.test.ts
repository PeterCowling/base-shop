import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const openDBMock = jest.fn();

jest.mock("idb", () => ({
  openDB: (...args: unknown[]) => openDBMock(...args),
}));

type KvKey = "version" | "syncedAt" | "products" | "index";

function mockDbWithSeed(seed: Partial<Record<KvKey, unknown>> = {}) {
  const kv = new Map<KvKey, unknown>(Object.entries(seed) as [KvKey, unknown][]);

  const store = {
    get: jest.fn(async (key: KvKey) => kv.get(key)),
    put: jest.fn(async (value: unknown, key: KvKey) => {
      kv.set(key, value);
      return undefined;
    }),
    clear: jest.fn(async () => {
      kv.clear();
      return undefined;
    }),
  };

  const tx = {
    objectStore: jest.fn(() => store),
    done: Promise.resolve(),
  };

  const db = {
    objectStoreNames: {
      contains: jest.fn(() => true),
    },
    createObjectStore: jest.fn(),
    transaction: jest.fn(() => tx),
  };

  openDBMock.mockImplementationOnce(async (_name: string, _version: number, options?: { upgrade?: (db: typeof db) => void }) => {
    options?.upgrade?.(db);
    return db;
  });

  return { kv, store, db };
}

describe("xaSearchDb", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("reads and sanitizes persisted cache values", async () => {
    mockDbWithSeed({
      version: "v1",
      syncedAt: 1700000000000,
      products: [{ id: "p1", title: "Studio Jacket" }],
      index: "{\"ok\":true}",
    });

    const { readXaSearchCache } = await import("../xaSearchDb");
    const cache = await readXaSearchCache();

    expect(cache).toEqual({
      version: "v1",
      syncedAt: 1700000000000,
      products: [{ id: "p1", title: "Studio Jacket" }],
      index: "{\"ok\":true}",
    });
  });

  it("falls back to in-memory cache when IndexedDB read fails", async () => {
    mockDbWithSeed({ version: "v1", syncedAt: 1, products: [], index: "idx" });

    const { readXaSearchCache } = await import("../xaSearchDb");
    const first = await readXaSearchCache();
    expect(first.version).toBe("v1");

    openDBMock.mockRejectedValueOnce(new Error("idb unavailable"));
    const second = await readXaSearchCache();

    expect(second).toEqual(first);
  });

  it("writes selected fields and clears cache", async () => {
    const seeded = mockDbWithSeed({ version: "v0" });
    const { writeXaSearchCache, clearXaSearchCache, readXaSearchCache } = await import("../xaSearchDb");

    await writeXaSearchCache({
      version: "v2",
      syncedAt: 1700000000001,
      products: [{ id: "p2" } as never],
      index: "serialized-index",
    });

    expect(seeded.store.put).toHaveBeenCalledWith("v2", "version");
    expect(seeded.store.put).toHaveBeenCalledWith(1700000000001, "syncedAt");
    expect(seeded.store.put).toHaveBeenCalledWith([{ id: "p2" }], "products");
    expect(seeded.store.put).toHaveBeenCalledWith("serialized-index", "index");

    const clearDb = mockDbWithSeed();
    await clearXaSearchCache();
    expect(clearDb.store.clear).toHaveBeenCalledTimes(1);

    openDBMock.mockRejectedValueOnce(new Error("idb unavailable"));
    const cache = await readXaSearchCache();
    expect(cache).toEqual({});
  });
});
