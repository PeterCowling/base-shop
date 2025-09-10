import { jest } from "@jest/globals";

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";

const RedisClientMock = jest.fn();
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
  RedisClientMock.mockReset();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("createSessionStore", () => {
  it("uses Redis when UPSTASH_REDIS_* env vars are present", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;

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
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;

    const { createSessionStore, setSessionStoreFactory } = await import("../store");
    const customStore = {} as any;
    setSessionStoreFactory(async () => customStore);

    const store = await createSessionStore();
    expect(store).toBe(customStore);
  });

  it("last setSessionStoreFactory wins", async () => {
    const { createSessionStore, setSessionStoreFactory } = await import("../store");
    setSessionStoreFactory(async () => ({ id: 1 } as any));
    setSessionStoreFactory(async () => ({ id: 2 } as any));

    const store = await createSessionStore();
    expect(store).toEqual({ id: 2 });
  });

  it(
    "falls back to MemorySessionStore and logs when SESSION_STORE=redis but env vars are missing",
    async () => {
      process.env.SESSION_STORE = "redis";

      const err = new Error("missing env");
      RedisClientMock.mockImplementation(() => {
        throw err;
      });
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { createSessionStore } = await import("../store");
      const { MemorySessionStore } = await import("../memoryStore");

      const store = await createSessionStore();

      expect(store).toBeInstanceOf(MemorySessionStore);
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to initialize Redis session store",
        err,
      );

      errorSpy.mockRestore();
    },
  );

  it("falls back to MemorySessionStore and logs when Redis instantiation fails", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;

    const err = new Error("boom");
    RedisClientMock.mockImplementation(() => {
      throw err;
    });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { createSessionStore } = await import("../store");
    const { MemorySessionStore } = await import("../memoryStore");

    const store = await createSessionStore();

    expect(store).toBeInstanceOf(MemorySessionStore);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to initialize Redis session store",
      err,
    );

    errorSpy.mockRestore();
  });
});

