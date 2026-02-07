import { describe, expect, it, jest } from "@jest/globals";

const openDbMock = jest.fn();

jest.mock("idb", () => ({
  openDB: (...args: unknown[]) => openDbMock(...args),
}));

describe("xaSearchDb", () => {
  it("falls back to in-memory cache when indexedDB fails", async () => {
    openDbMock.mockImplementationOnce(() => {
      throw new Error("no indexeddb");
    });
    jest.resetModules();
    const db = await import("../xaSearchDb");

    await db.writeXaSearchCache({
      version: "v1",
      syncedAt: 123,
      products: [],
      index: "idx",
    });

    const cached = await db.readXaSearchCache();
    expect(cached.version).toBe("v1");
    expect(cached.index).toBe("idx");

    await db.clearXaSearchCache();
    const cleared = await db.readXaSearchCache();
    expect(cleared.version).toBeUndefined();
  });

  it("stores and reads values via indexedDB", async () => {
    const store = new Map<string, unknown>();
    openDbMock.mockResolvedValue({
      transaction: () => ({
        objectStore: () => ({
          get: (key: string) => store.get(key),
          put: (value: unknown, key: string) => {
            store.set(key, value);
          },
          clear: () => store.clear(),
        }),
        done: Promise.resolve(),
      }),
    });

    jest.resetModules();
    const db = await import("../xaSearchDb");

    await db.writeXaSearchCache({
      version: "v2",
      syncedAt: 456,
      products: [],
      index: "idx2",
    });

    const cached = await db.readXaSearchCache();
    expect(cached.version).toBe("v2");
    expect(cached.syncedAt).toBe(456);
    expect(cached.index).toBe("idx2");

    await db.clearXaSearchCache();
    const cleared = await db.readXaSearchCache();
    expect(cleared.version).toBeUndefined();
  });
});
