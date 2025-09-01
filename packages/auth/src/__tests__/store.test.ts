import { jest } from "@jest/globals";

class RedisClientMock {}
class RedisSessionStoreMock {}

jest.mock("@upstash/redis", () => ({ Redis: RedisClientMock }));
jest.mock("../redisStore", () => ({ RedisSessionStore: RedisSessionStoreMock }));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {
    get SESSION_STORE() {
      return process.env.SESSION_STORE;
    },
    get UPSTASH_REDIS_REST_URL() {
      return process.env.UPSTASH_REDIS_REST_URL;
    },
    get UPSTASH_REDIS_REST_TOKEN() {
      return process.env.UPSTASH_REDIS_REST_TOKEN;
    },
  },
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("createSessionStore", () => {
  it("uses Redis when UPSTASH_REDIS_* env vars are present", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const { createSessionStore } = await import("../store");

    const store = await createSessionStore();
    expect(store).toBeInstanceOf(RedisSessionStoreMock);
  });

  it("falls back to MemorySessionStore when redis env vars are missing", async () => {
    const { createSessionStore } = await import("../store");
    const { MemorySessionStore } = await import("../memoryStore");

    const store = await createSessionStore();
    expect(store).toBeInstanceOf(MemorySessionStore);
  });

  it("setSessionStoreFactory overrides default store", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const { createSessionStore, setSessionStoreFactory } = await import("../store");
    const customStore = {} as any;
    setSessionStoreFactory(async () => customStore);

    const store = await createSessionStore();
    expect(store).toBe(customStore);
  });
});

