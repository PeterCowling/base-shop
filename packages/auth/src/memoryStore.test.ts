import { MemorySessionStore } from "./memoryStore";
import type { SessionRecord } from "./store";

describe("MemorySessionStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("stores and retrieves records until TTL expires", async () => {
    const store = new MemorySessionStore(1);
    const record: SessionRecord = {
      sessionId: "s1",
      customerId: "c1",
      userAgent: "agent",
      createdAt: new Date(),
    };

    await store.set(record);
    await expect(store.get(record.sessionId)).resolves.toEqual(record);

    jest.advanceTimersByTime(1001);

    await expect(store.get(record.sessionId)).resolves.toBeNull();
  });

  it("lists only unexpired sessions for a customer", async () => {
    const store = new MemorySessionStore(1);
    const first: SessionRecord = {
      sessionId: "s1",
      customerId: "c1",
      userAgent: "agent",
      createdAt: new Date(),
    };
    await store.set(first);

    jest.advanceTimersByTime(500);

    const second: SessionRecord = {
      sessionId: "s2",
      customerId: "c1",
      userAgent: "agent",
      createdAt: new Date(),
    };
    const other: SessionRecord = {
      sessionId: "s3",
      customerId: "c2",
      userAgent: "agent",
      createdAt: new Date(),
    };
    await store.set(second);
    await store.set(other);

    jest.advanceTimersByTime(600);

    await expect(store.list("c1")).resolves.toEqual([second]);
  });

  it("deletes sessions", async () => {
    const store = new MemorySessionStore(1);
    const record: SessionRecord = {
      sessionId: "s4",
      customerId: "c1",
      userAgent: "agent",
      createdAt: new Date(),
    };
    await store.set(record);

    await store.delete(record.sessionId);

    await expect(store.get(record.sessionId)).resolves.toBeNull();
  });
});
