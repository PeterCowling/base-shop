import { jest } from "@jest/globals";
import { MemorySessionStore } from "../src/memoryStore";
import type { SessionRecord } from "../src/store";

describe("MemorySessionStore basic operations", () => {
  const createRecord = (id: string, customerId = "c1"): SessionRecord => ({
    sessionId: id,
    customerId,
    userAgent: "agent",
    createdAt: new Date(),
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null for unknown keys", async () => {
    const store = new MemorySessionStore(1);
    await expect(store.get("missing")).resolves.toBeNull();
  });

  it("stores values and removes them after expiration", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);
    // immediately available
    await expect(store.get("s1")).resolves.toEqual(record);
    // advance beyond ttl
    jest.advanceTimersByTime(1001);
    await expect(store.get("s1")).resolves.toBeNull();
  });

  it("overwrites existing keys with latest value", async () => {
    const store = new MemorySessionStore(1);
    const record1 = createRecord("s1");
    const record2 = { ...record1, userAgent: "updated" };
    await store.set(record1);
    await store.set(record2);
    await expect(store.get("s1")).resolves.toEqual(record2);
  });

  it("deletes keys", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);
    await store.delete("s1");
    await expect(store.get("s1")).resolves.toBeNull();
  });
});

