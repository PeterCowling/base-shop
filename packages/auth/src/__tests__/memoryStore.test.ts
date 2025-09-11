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

  it("get returns null when session does not exist", async () => {
    const store = new MemorySessionStore(1);
    await expect(store.get("missing")).resolves.toBeNull();
  });

  it("set stores session with future expiration", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    const now = Date.now();
    await store.set(record);

    const entry = (store as any).sessions.get(record.sessionId);
    expect(entry.record).toEqual(record);
    expect(entry.expires).toBeGreaterThan(now);
  });

  it("get returns record before expiry and null after TTL", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    await expect(store.get(record.sessionId)).resolves.toEqual(record);

    jest.advanceTimersByTime(1001);

    await expect(store.get(record.sessionId)).resolves.toBeNull();
  });

  it("purges expired sessions on access", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    jest.advanceTimersByTime(1001);
    await store.get(record.sessionId);

    expect((store as any).sessions.has(record.sessionId)).toBe(false);
  });

  it("list returns only unexpired sessions for the specified customerId", async () => {
    const store = new MemorySessionStore(1);
    const first = createRecord("s1");
    await store.set(first);

    jest.advanceTimersByTime(500);

    const second = createRecord("s2");
    const otherCustomer = createRecord("s3", "c2");
    await store.set(second);
    await store.set(otherCustomer);

    await expect(store.list("c1")).resolves.toEqual([first, second]);

    jest.advanceTimersByTime(600);

    await expect(store.list("c1")).resolves.toEqual([second]);
  });

  it("delete removes existing session", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    await store.delete(record.sessionId);

    await expect(store.get(record.sessionId)).resolves.toBeNull();
    await expect(store.list(record.customerId)).resolves.toEqual([]);
    expect((store as any).sessions.has(record.sessionId)).toBe(false);
  });

  it("delete resolves when session does not exist without modifying sessions map", async () => {
    const store = new MemorySessionStore(1);
    const record = createRecord("s1");
    await store.set(record);

    const sessions = (store as any).sessions;
    const sizeBefore = sessions.size;

    await expect(store.delete("missing")).resolves.toBeUndefined();

    expect(sessions.size).toBe(sizeBefore);
    expect(sessions.has(record.sessionId)).toBe(true);
  });

  it("only retains the latest concurrent set for the same id", async () => {
    const store = new MemorySessionStore(1);
    const first = createRecord("s1");
    const second = { ...createRecord("s1"), userAgent: "agent-2" };
    const third = { ...createRecord("s1"), userAgent: "agent-3" };

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const sets = [
      delay(0).then(() => store.set(first)),
      delay(50).then(() => store.set(second)),
      delay(100).then(() => store.set(third)),
    ];

    const all = Promise.all(sets);
    jest.advanceTimersByTime(100);
    await all;

    const entry = (store as any).sessions.get("s1");
    expect((store as any).sessions.size).toBe(1);
    expect(entry.record).toEqual(third);
    expect(entry.expires).toBe(Date.now() + 1000);
  });
});

