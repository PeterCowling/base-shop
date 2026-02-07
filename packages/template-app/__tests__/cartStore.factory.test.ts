import { jest } from "@jest/globals";

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";

describe("createCartStore backend selection", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("honors explicit backend=memory", async () => {
    await jest.isolateModulesAsync(async () => {
      const memoryInstance = { backend: "memory" } as const;
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisCtor = jest.fn();

      jest.doMock("@acme/platform-core/cartStore/memoryStore", () => ({
        MemoryCartStore: memoryCtor,
      }));
      jest.doMock("@acme/platform-core/cartStore/redisStore", () => ({
        RedisCartStore: redisCtor,
      }));
      jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));

      const { createCartStore } = await import("@acme/platform-core/cartStore");
      const store = createCartStore({ backend: "memory" });
      expect(store).toBe(memoryInstance);
      expect(redisCtor).not.toHaveBeenCalled();
    });
  });

  it("uses redis when UPSTASH env vars exist", async () => {
    await jest.isolateModulesAsync(async () => {
      const memoryInstance = { backend: "memory" } as const;
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisInstance = { backend: "redis" } as const;
      const redisCtor = jest.fn().mockReturnValue(redisInstance);
      const redisClient = {};
      const RedisClass = jest.fn().mockReturnValue(redisClient);

      jest.doMock("@acme/platform-core/cartStore/memoryStore", () => ({
        MemoryCartStore: memoryCtor,
      }));
      jest.doMock("@acme/platform-core/cartStore/redisStore", () => ({
        RedisCartStore: redisCtor,
      }));
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({
          UPSTASH_REDIS_REST_URL: "https://example.com",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        }),
      }));
      jest.doMock("@upstash/redis", () => ({ Redis: RedisClass }));

      const { createCartStore } = await import("@acme/platform-core/cartStore");
      const store = createCartStore();
      expect(RedisClass).toHaveBeenCalledTimes(1);
      expect(redisCtor).toHaveBeenCalledWith(
        redisClient,
        expect.any(Number),
        memoryInstance,
      );
      expect(store).toBe(redisInstance);
    });
  });

  it("falls back to memory when @upstash/redis import fails", async () => {
    await jest.isolateModulesAsync(async () => {
      const memoryInstance = { backend: "memory" } as const;
      const memoryCtor = jest.fn().mockReturnValue(memoryInstance);
      const redisCtor = jest.fn();

      jest.doMock("@acme/platform-core/cartStore/memoryStore", () => ({
        MemoryCartStore: memoryCtor,
      }));
      jest.doMock("@acme/platform-core/cartStore/redisStore", () => ({
        RedisCartStore: redisCtor,
      }));
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({
          UPSTASH_REDIS_REST_URL: "https://example.com",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        }),
      }));
      jest.doMock("@upstash/redis", () => {
        throw new Error("import fail");
      });

      const { createCartStore } = await import("@acme/platform-core/cartStore");
      const store = createCartStore();
      expect(redisCtor).not.toHaveBeenCalled();
      expect(store).toBe(memoryInstance);
    });
  });
});

describe("getDefaultCartStore", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("lazily creates and can reset the default store", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
      const mod = await import("@acme/platform-core/cartStore");
      const createSpy = jest
        .spyOn(mod, "createCartStore")
        .mockImplementation(() => ({} as any));

      const first = mod.getDefaultCartStore();
      const second = mod.getDefaultCartStore();
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);

      mod.__setDefaultCartStore(null);
      const third = mod.getDefaultCartStore();
      expect(createSpy).toHaveBeenCalledTimes(2);
      expect(third).not.toBe(first);
    });
  });
});

