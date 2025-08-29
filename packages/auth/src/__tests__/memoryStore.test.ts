import { MemorySessionStore } from "../memoryStore";
import type { SessionRecord } from "../store";

describe("MemorySessionStore", () => {
  const createRecord = (
    sessionId: string,
    customerId = "c1"
  ): SessionRecord => ({
    sessionId,
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

  it("returns a session before it expires", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    await expect(store.get(record.sessionId)).resolves.toEqual(record);
  });

  it("removes expired sessions on get", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    jest.advanceTimersByTime(1001);

    await expect(store.get(record.sessionId)).resolves.toBeNull();
    await expect(store.list(record.customerId)).resolves.toEqual([]);
  });

  it("lists only active sessions for a customer", async () => {
    const store = new MemorySessionStore(1);
    const expired = createRecord("s1");
    await store.set(expired);

    jest.advanceTimersByTime(500);

    const active = createRecord("s2");
    const otherCustomer = createRecord("s3", "c2");
    await store.set(active);
    await store.set(otherCustomer);

    jest.advanceTimersByTime(600);

    await expect(store.list("c1")).resolves.toEqual([active]);
  });

  it("deletes sessions", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    await store.delete(record.sessionId);

    await expect(store.get(record.sessionId)).resolves.toBeNull();
  });
});

