import { jest } from "@jest/globals";

import { RedisSessionStore } from "../src/redisStore";
import type { SessionRecord } from "../src/store";

function createMockRedis() {
  const data = new Map<string, any>();
  const sets = new Map<string, Set<string>>();
  return {
    data,
    sets,
    get: jest.fn(async (key: string) => data.get(key) ?? null),
    set: jest.fn(async (key: string, value: any, opts: any) => {
      // mimic JSON serialization of dates
      data.set(key, JSON.parse(JSON.stringify(value)));
    }),
    del: jest.fn(async (key: string) => {
      data.delete(key);
    }),
    sadd: jest.fn(async (key: string, member: string) => {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key)!.add(member);
    }),
    srem: jest.fn(async (key: string, member: string) => {
      sets.get(key)?.delete(member);
    }),
    expire: jest.fn(async (_key: string, _ttl: number) => {
      /* no-op */
    }),
    smembers: jest.fn(async (key: string) => Array.from(sets.get(key) ?? [])),
    mget: jest.fn(async (...keys: string[]) => keys.map((k) => data.get(k) ?? null)),
  };
}

describe("RedisSessionStore", () => {
  const ttl = 60;
  const createRecord = (id: string, customerId = "c1"): SessionRecord => ({
    sessionId: id,
    customerId,
    userAgent: "agent",
    createdAt: new Date("2020-01-01T00:00:00.000Z"),
  });

  let client: ReturnType<typeof createMockRedis>;
  let store: RedisSessionStore;

  beforeEach(() => {
    client = createMockRedis();
    store = new RedisSessionStore(client as any, ttl);
  });

  it("set writes session data with TTL and updates customer session set", async () => {
    const record = createRecord("s1");
    await store.set(record);

    expect(client.set).toHaveBeenCalledWith("session:s1", record, { ex: ttl });
    expect(client.sadd).toHaveBeenCalledWith("customer_sessions:c1", "s1");
    expect(client.expire).toHaveBeenCalledWith("customer_sessions:c1", ttl);
    expect(client.data.get("session:s1")).toEqual(
      JSON.parse(JSON.stringify(record))
    );
    expect(Array.from(client.sets.get("customer_sessions:c1") ?? [])).toEqual([
      "s1",
    ]);
  });

  it("get returns null for missing keys and converts createdAt to Date", async () => {
    await expect(store.get("missing")).resolves.toBeNull();

    const record = createRecord("s2");
    await store.set(record);

    const res = await store.get("s2");
    expect(res).not.toBeNull();
    expect(res).toMatchObject({
      sessionId: record.sessionId,
      customerId: record.customerId,
      userAgent: record.userAgent,
    });
    expect(res!.createdAt).toBeInstanceOf(Date);
    expect(res!.createdAt.toISOString()).toBe(
      record.createdAt.toISOString()
    );
  });

  it("delete removes session keys and updates the customer session set", async () => {
    const record = createRecord("s3");
    await store.set(record);

    await store.delete("s3");
    expect(client.del).toHaveBeenCalledWith("session:s3");
    expect(client.srem).toHaveBeenCalledWith("customer_sessions:c1", "s3");
    expect(client.data.get("session:s3")).toBeUndefined();
    expect(Array.from(client.sets.get("customer_sessions:c1") ?? [])).toEqual(
      []
    );
  });

  it("list returns hydrated SessionRecord[] and skips nulls", async () => {
    const r1 = createRecord("s1");
    const r2 = createRecord("s2");
    await store.set(r1);
    await store.set(r2);

    // remove second session data to simulate missing record
    client.data.delete("session:s2");

    const result = await store.list("c1");

    expect(client.smembers).toHaveBeenCalledWith("customer_sessions:c1");
    expect(client.mget).toHaveBeenCalledWith("session:s1", "session:s2");
    expect(result).toHaveLength(1);
    const [rec] = result;
    expect(rec.sessionId).toBe("s1");
    expect(rec.customerId).toBe("c1");
    expect(rec.createdAt).toBeInstanceOf(Date);
    expect(rec.createdAt.toISOString()).toBe(r1.createdAt.toISOString());
  });
});

