import { MemorySessionStore } from "../memoryStore";
import type { SessionRecord } from "../store";

describe("MemorySessionStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("expires sessions and returns only active sessions", async () => {
    const store = new MemorySessionStore(1);
    const expired: SessionRecord = {
      sessionId: "s1",
      customerId: "c1",
      userAgent: "agent",
      createdAt: new Date(),
    };
    await store.set(expired);

    jest.advanceTimersByTime(500);
    const active: SessionRecord = {
      sessionId: "s2",
      customerId: "c1",
      userAgent: "agent",
      createdAt: new Date(),
    };
    await store.set(active);

    jest.advanceTimersByTime(600);

    await expect(store.get(expired.sessionId)).resolves.toBeNull();
    await expect(store.list("c1")).resolves.toEqual([active]);
    await expect(store.get(active.sessionId)).resolves.toEqual(active);
    await expect(store.list("c1")).resolves.toEqual([active]);
  });
});
