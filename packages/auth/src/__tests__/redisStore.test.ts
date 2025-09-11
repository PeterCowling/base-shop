import { RedisSessionStore } from "../redisStore";
import type { SessionRecord } from "../store";

type MockRedis = ReturnType<typeof createMockRedis>;

function createMockRedis() {
  const data = new Map<string, any>();
  const sets = new Map<string, Set<string>>();
  return {
    get: jest.fn(async (key: string) => data.get(key) ?? null),
    set: jest.fn(async (key: string, value: any) => {
      data.set(key, { ...value, createdAt: value.createdAt.toISOString() });
    }),
    sadd: jest.fn(async (key: string, member: string) => {
      const set = sets.get(key) ?? new Set<string>();
      set.add(member);
      sets.set(key, set);
    }),
    smembers: jest.fn(async (key: string) => {
      return Array.from(sets.get(key) ?? []);
    }),
    mget: jest.fn(async (...keys: string[]) => keys.map((k) => data.get(k) ?? null)),
    srem: jest.fn(async (key: string, member: string) => {
      const set = sets.get(key);
      if (set) set.delete(member);
    }),
    expire: jest.fn(async () => {}),
    del: jest.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

const createRecord = (sessionId: string, customerId = "c1"): SessionRecord => ({
  sessionId,
  customerId,
  userAgent: "agent",
  createdAt: new Date("2020-01-01T00:00:00.000Z"),
});

describe("RedisSessionStore", () => {
  const ttl = 60;
  let client: MockRedis;
  let store: RedisSessionStore;

  beforeEach(() => {
    client = createMockRedis();
    store = new RedisSessionStore(client as any, ttl);
  });

  it("returns null when session is missing", async () => {
    await expect(store.get("missing")).resolves.toBeNull();
    expect(client.get).toHaveBeenCalledWith("session:missing");
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.set).not.toHaveBeenCalled();
    expect(client.sadd).not.toHaveBeenCalled();
    expect(client.expire).not.toHaveBeenCalled();
    expect(client.smembers).not.toHaveBeenCalled();
    expect(client.mget).not.toHaveBeenCalled();
    expect(client.srem).not.toHaveBeenCalled();
    expect(client.del).not.toHaveBeenCalled();
  });

  it("sets session with ttl and registers customer session", async () => {
    const record = createRecord("s1");
    await store.set(record);

    expect(client.set).toHaveBeenCalledWith("session:s1", record, { ex: ttl });
    expect(client.sadd).toHaveBeenCalledWith("customer_sessions:c1", "s1");
    expect(client.expire).toHaveBeenCalledWith("customer_sessions:c1", ttl);
  });

  it("retrieves session and hydrates createdAt", async () => {
    const record = createRecord("s1");
    await store.set(record);

    const result = await store.get("s1");
    expect(result).toEqual(record);
    expect(result?.createdAt).toBeInstanceOf(Date);
  });

  it("lists sessions for a customer", async () => {
    const r1 = createRecord("s1");
    const r2 = createRecord("s2");
    await store.set(r1);
    await store.set(r2);

    const list = await store.list("c1");
    expect(client.mget).toHaveBeenCalledWith("session:s1", "session:s2");
    expect(list).toHaveLength(2);
    expect(list).toEqual(expect.arrayContaining([r1, r2]));
    list.forEach((r) => expect(r.createdAt).toBeInstanceOf(Date));
  });

  it("returns only existing sessions with hydrated dates", async () => {
    const record = createRecord("a", "cust");
    (client.smembers as jest.Mock).mockResolvedValue(["a", "b"]);
    (client.mget as jest.Mock).mockResolvedValue([
      { ...record, createdAt: record.createdAt.toISOString() },
      null,
    ]);

    const list = await store.list("cust");
    expect(client.mget).toHaveBeenCalledWith("session:a", "session:b");
    expect(list).toEqual([record]);
    expect(list[0].createdAt).toBeInstanceOf(Date);
  });

  it("returns empty array when smembers returns an empty array", async () => {
    (client.smembers as jest.Mock).mockResolvedValue([]);

    await expect(store.list("cust")).resolves.toEqual([]);
    expect(client.mget).not.toHaveBeenCalled();
  });

  it("returns empty array when smembers returns undefined", async () => {
    (client.smembers as jest.Mock).mockResolvedValue(undefined as any);

    const list = await store.list("cust");
    expect(list).toEqual([]);
    expect(client.mget).not.toHaveBeenCalled();
  });

  it("returns empty array when smembers returns null", async () => {
    (client.smembers as jest.Mock).mockResolvedValue(null as any);

    const list = await store.list("cust");
    expect(list).toEqual([]);
    expect(client.mget).not.toHaveBeenCalled();
  });

  it("deletes sessions", async () => {
    const record = createRecord("s1");
    await store.set(record);

    await store.delete("s1");
    expect(client.del).toHaveBeenCalledWith("session:s1");
    expect(client.srem).toHaveBeenCalledWith("customer_sessions:c1", "s1");
    await expect(store.get("s1")).resolves.toBeNull();
    await expect(store.list("c1")).resolves.toEqual([]);
  });

  it("does not call srem when session record is missing", async () => {
    jest.spyOn(store, "get").mockResolvedValue(null);
    const sremSpy = jest.spyOn(client, "srem");

    await store.delete("id");

    expect(client.del).toHaveBeenCalledWith("session:id");
    expect(sremSpy).not.toHaveBeenCalled();
  });
});

