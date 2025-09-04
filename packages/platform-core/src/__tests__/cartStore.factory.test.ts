/** @jest-environment node */

describe("cartStore factory", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("Env forces redis with credentials -> returns RedisCartStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const redisInstance = { backend: "redis" } as const;
      const memoryInstance = { backend: "memory" } as const;
      const redisCtor = jest.fn().mockReturnValue(redisInstance);
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisClient = {};
      const RedisClass = jest.fn().mockReturnValue(redisClient);

      jest.doMock("../cartStore/redisStore", () => ({ RedisCartStore: redisCtor }));
      jest.doMock("../cartStore/memoryStore", () => ({ MemoryCartStore: memoryCtor }));
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: "token",
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));

      const { createCartStore } = await import("../cartStore");
      const store = createCartStore();

      expect(store).toBe(redisInstance);
    });
  });

  it("Env undefined but credentials present -> returns RedisCartStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const redisInstance = { backend: "redis" } as const;
      const memoryInstance = { backend: "memory" } as const;
      const redisCtor = jest.fn().mockReturnValue(redisInstance);
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisClient = {};
      const RedisClass = jest.fn().mockReturnValue(redisClient);

      jest.doMock("../cartStore/redisStore", () => ({ RedisCartStore: redisCtor }));
      jest.doMock("../cartStore/memoryStore", () => ({ MemoryCartStore: memoryCtor }));
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: "token",
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));

      const { createCartStore } = await import("../cartStore");
      const store = createCartStore();

      expect(store).toBe(redisInstance);
    });
  });

  it.each([
    [
      "SESSION_STORE set to memory",
      {
        SESSION_STORE: "memory",
        UPSTASH_REDIS_REST_URL: "https://example",
        UPSTASH_REDIS_REST_TOKEN: "token",
      },
    ],
    ["redis credentials missing", {}],
  ])("Env %s -> returns MemoryCartStore", async (_desc, env) => {
    await jest.isolateModulesAsync(async () => {
      const memoryInstance = { backend: "memory" } as const;
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisCtor = jest.fn();

      jest.doMock("../cartStore/memoryStore", () => ({ MemoryCartStore: memoryCtor }));
      jest.doMock("../cartStore/redisStore", () => ({ RedisCartStore: redisCtor }));
      jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => env }));
      jest.doMock("@upstash/redis", () => ({ Redis: jest.fn() }));

      const { createCartStore } = await import("../cartStore");
      const store = createCartStore();

      expect(redisCtor).not.toHaveBeenCalled();
      expect(store).toBe(memoryInstance);
    });
  });

  it("Redis import throws -> falls back to MemoryCartStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const memoryInstance = { backend: "memory" } as const;
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisCtor = jest.fn();

      jest.doMock("../cartStore/memoryStore", () => ({ MemoryCartStore: memoryCtor }));
      jest.doMock("../cartStore/redisStore", () => ({ RedisCartStore: redisCtor }));
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: "token",
        }),
      }));
      jest.doMock("@upstash/redis", () => {
        throw new Error("import fail");
      });

      const { createCartStore } = await import("../cartStore");
      const store = createCartStore();

      expect(redisCtor).not.toHaveBeenCalled();
      expect(store).toBe(memoryInstance);
    });
  });

  it("Options override { backend: 'memory' } returns MemoryCartStore", async () => {
    await jest.isolateModulesAsync(async () => {
      const memoryInstance = { backend: "memory" } as const;
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisCtor = jest.fn();
      const RedisClass = jest.fn().mockReturnValue({});

      jest.doMock("../cartStore/memoryStore", () => ({ MemoryCartStore: memoryCtor }));
      jest.doMock("../cartStore/redisStore", () => ({ RedisCartStore: redisCtor }));
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example",
          UPSTASH_REDIS_REST_TOKEN: "token",
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));

      const { createCartStore } = await import("../cartStore");
      const store = createCartStore({ backend: "memory" });

      expect(redisCtor).not.toHaveBeenCalled();
      expect(store).toBe(memoryInstance);
    });
  });
});
