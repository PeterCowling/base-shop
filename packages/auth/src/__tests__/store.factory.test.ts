/** @jest-environment node */

import { jest } from "@jest/globals";

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";

describe("createSessionStore factory", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const env = (overrides: Record<string, unknown> = {}) => ({
    SESSION_STORE: undefined,
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    ...overrides,
  });

  it("Env forces redis with credentials -> returns RedisSessionStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const redisClient = {};
      const RedisClass = jest.fn().mockReturnValue(redisClient);
      const redisStoreInstance = {};
      const RedisSessionStore = jest.fn().mockReturnValue(redisStoreInstance);
      const MemorySessionStore = jest.fn();

      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: env({
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));
      jest.doMock("../redisStore", () => ({ RedisSessionStore }));
      jest.doMock("../memoryStore", () => ({ MemorySessionStore }));

      const mod = await import("../store");
      const store = await mod.createSessionStore();

      expect(RedisClass).toHaveBeenCalledWith({
        url: "https://example",
        token: STRONG_TOKEN,
      });
      expect(RedisSessionStore).toHaveBeenCalledWith(
        redisClient,
        mod.SESSION_TTL_S,
      );
      expect(MemorySessionStore).not.toHaveBeenCalled();
      expect(store).toBe(redisStoreInstance);
    });
  });

  it("Env undefined but credentials present -> returns RedisSessionStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const redisClient = {};
      const RedisClass = jest.fn().mockReturnValue(redisClient);
      const redisStoreInstance = {};
      const RedisSessionStore = jest.fn().mockReturnValue(redisStoreInstance);
      const MemorySessionStore = jest.fn();

      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: env({
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));
      jest.doMock("../redisStore", () => ({ RedisSessionStore }));
      jest.doMock("../memoryStore", () => ({ MemorySessionStore }));

      const mod = await import("../store");
      const store = await mod.createSessionStore();

      expect(RedisClass).toHaveBeenCalled();
      expect(RedisSessionStore).toHaveBeenCalledWith(
        redisClient,
        mod.SESSION_TTL_S,
      );
      expect(MemorySessionStore).not.toHaveBeenCalled();
      expect(store).toBe(redisStoreInstance);
    });
  });

  it.each([
    [
      "SESSION_STORE set to memory",
      env({
        SESSION_STORE: "memory",
        UPSTASH_REDIS_REST_URL: "https://example",
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      }),
    ],
    ["redis credentials missing", env({})],
  ])("Env %s -> returns MemorySessionStore", async (_desc, coreEnv) => {
    await jest.isolateModulesAsync(async () => {
      const RedisClass = jest.fn();
      const RedisSessionStore = jest.fn();
      const memoryStoreInstance = {};
      const MemorySessionStore = jest
        .fn()
        .mockReturnValue(memoryStoreInstance);

      jest.doMock("@acme/config/env/core", () => ({ coreEnv }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));
      jest.doMock("../redisStore", () => ({ RedisSessionStore }));
      jest.doMock("../memoryStore", () => ({ MemorySessionStore }));

      const mod = await import("../store");
      const store = await mod.createSessionStore();

      expect(RedisClass).not.toHaveBeenCalled();
      expect(RedisSessionStore).not.toHaveBeenCalled();
      expect(MemorySessionStore).toHaveBeenCalledWith(mod.SESSION_TTL_S);
      expect(store).toBe(memoryStoreInstance);
    });
  });

  it("Custom factory bypasses redis/memory logic", async () => {
    await jest.isolateModulesAsync(async () => {
      const factory = jest.fn().mockResolvedValue({ backend: "custom" });
      const RedisClass = jest.fn();
      const RedisSessionStore = jest.fn();
      const MemorySessionStore = jest.fn();

      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: env({
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));
      jest.doMock("../redisStore", () => ({ RedisSessionStore }));
      jest.doMock("../memoryStore", () => ({ MemorySessionStore }));

      const { createSessionStore, setSessionStoreFactory } = await import(
        "../store"
      );
      setSessionStoreFactory(factory);
      const store = await createSessionStore();

      expect(factory).toHaveBeenCalled();
      expect(RedisClass).not.toHaveBeenCalled();
      expect(RedisSessionStore).not.toHaveBeenCalled();
      expect(MemorySessionStore).not.toHaveBeenCalled();
      expect(store).toEqual({ backend: "custom" });
    });
  });

  it("Redis import throws -> falls back to MemorySessionStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const memoryStoreInstance = {};
      const MemorySessionStore = jest
        .fn()
        .mockReturnValue(memoryStoreInstance);
      const err = new Error("import fail");

      jest.doMock("@acme/config/env/core", () => ({
        coreEnv: env({
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        }),
      }));
      jest.doMock("@upstash/redis", () => {
        throw err;
      });
      jest.doMock("../redisStore", () => ({ RedisSessionStore: jest.fn() }));
      jest.doMock("../memoryStore", () => ({ MemorySessionStore }));

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const mod = await import("../store");
      const store = await mod.createSessionStore();

      expect(MemorySessionStore).toHaveBeenCalledWith(mod.SESSION_TTL_S);
      expect(store).toBe(memoryStoreInstance);
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to initialize Redis session store",
        err,
      );

      errorSpy.mockRestore();
    });
  });
});

