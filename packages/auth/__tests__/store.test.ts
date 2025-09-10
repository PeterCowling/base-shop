import { jest } from "@jest/globals";

describe("createSessionStore", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("uses Redis when credentials exist", async () => {
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: {
        UPSTASH_REDIS_REST_URL: "https://example",
        UPSTASH_REDIS_REST_TOKEN: "token",
      },
    }));
    const redisCtor = jest.fn();
    jest.doMock("@upstash/redis", () => ({
      Redis: class {
        constructor(opts: unknown) {
          redisCtor(opts);
        }
      },
    }));
    const { createSessionStore } = await import("../src/store");
    const { RedisSessionStore } = await import("../src/redisStore");
    const store = await createSessionStore();
    expect(store).toBeInstanceOf(RedisSessionStore);
    expect(redisCtor).toHaveBeenCalledWith({
      url: "https://example",
      token: "token",
    });
  });

  it("falls back to MemorySessionStore when credentials missing", async () => {
    jest.doMock("@acme/config/env/core", () => ({ coreEnv: {} }));
    const { createSessionStore } = await import("../src/store");
    const { MemorySessionStore } = await import("../src/memoryStore");
    const store = await createSessionStore();
    expect(store).toBeInstanceOf(MemorySessionStore);
  });

  it("falls back to MemorySessionStore when SESSION_STORE is unrecognized", async () => {
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { SESSION_STORE: "foobar" },
    }));
    const { createSessionStore } = await import("../src/store");
    const { MemorySessionStore } = await import("../src/memoryStore");
    const store = await createSessionStore();
    expect(store).toBeInstanceOf(MemorySessionStore);
  });

  it("allows overriding via setSessionStoreFactory", async () => {
    jest.doMock("@acme/config/env/core", () => ({ coreEnv: {} }));
    const { createSessionStore, setSessionStoreFactory } = await import(
      "../src/store"
    );
    const custom = { custom: true };
    setSessionStoreFactory(async () => custom);
    const store = await createSessionStore();
    expect(store).toBe(custom);
  });

  it("logs error and falls back when Redis initialization fails", async () => {
    const err = new Error("boom");
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: {
        UPSTASH_REDIS_REST_URL: "https://example",
        UPSTASH_REDIS_REST_TOKEN: "token",
      },
    }));
    jest.doMock("@upstash/redis", () => ({
      Redis: class {
        constructor() {
          throw err;
        }
      },
    }));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { createSessionStore } = await import("../src/store");
    const { MemorySessionStore } = await import("../src/memoryStore");
    const store = await createSessionStore();
    expect(store).toBeInstanceOf(MemorySessionStore);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to initialize Redis session store",
      err,
    );
    consoleSpy.mockRestore();
  });
});
