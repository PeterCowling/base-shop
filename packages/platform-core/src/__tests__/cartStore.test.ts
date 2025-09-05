/** @jest-environment node */

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";

describe("createCartStore", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("uses MemoryCartStore with provided TTL when redis is not configured", async () => {
    const memoryStoreInstance = { backend: "memory" } as const;
    const memoryCtor = jest.fn().mockReturnValue(memoryStoreInstance);
    jest.doMock("../cartStore/memoryStore", () => ({
      MemoryCartStore: memoryCtor,
    }));
    jest.doMock("../cartStore/redisStore", () => ({
      RedisCartStore: jest.fn(),
    }));
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({}),
    }));

    const { createCartStore } = await import("../cartStore");
    const store = createCartStore({ ttlSeconds: 42 });

    expect(memoryCtor).toHaveBeenCalledWith(42);
    expect(store).toBe(memoryStoreInstance);
  });

  it("uses RedisCartStore and passes TTL when redis is configured", async () => {
    const memoryStoreInstance = { backend: "memory" } as const;
    const memoryCtor = jest.fn().mockReturnValue(memoryStoreInstance);
    const redisStoreInstance = { backend: "redis" } as const;
    const redisCtor = jest.fn().mockReturnValue(redisStoreInstance);
    const redisClient = {};
    const RedisClass = jest.fn().mockReturnValue(redisClient);

    jest.doMock("../cartStore/memoryStore", () => ({
      MemoryCartStore: memoryCtor,
    }));
    jest.doMock("../cartStore/redisStore", () => ({
      RedisCartStore: redisCtor,
    }));
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({
        UPSTASH_REDIS_REST_URL: "https://example",
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      }),
    }));
    jest.doMock("@upstash/redis", () => ({
      Redis: RedisClass,
    }));

    const { createCartStore } = await import("../cartStore");
    const store = createCartStore({ ttlSeconds: 99 });

    expect(RedisClass).toHaveBeenCalledWith({
      url: "https://example",
      token: STRONG_TOKEN,
    });
    expect(memoryCtor).toHaveBeenCalledWith(99);
    expect(redisCtor).toHaveBeenCalledWith(redisClient, 99, memoryStoreInstance);
    expect(store).toBe(redisStoreInstance);
  });

  it("loads core env only once even if createCartStore is called multiple times", async () => {
    const loadCoreEnv = jest.fn().mockReturnValue({});
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv }));

    const { createCartStore } = await import("../cartStore");

    createCartStore();
    createCartStore();

    expect(loadCoreEnv).toHaveBeenCalledTimes(1);
  });
});

describe("default cart store wrappers", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("delegates wrapper calls to the default store", async () => {
    const mockStore = {
      createCart: jest.fn().mockResolvedValue("id"),
      getCart: jest.fn().mockResolvedValue({}),
      setCart: jest.fn().mockResolvedValue(undefined),
      deleteCart: jest.fn().mockResolvedValue(undefined),
      incrementQty: jest.fn().mockResolvedValue({}),
      setQty: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(null),
    } as const;

    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({}),
    }));

    const mod = await import("../cartStore");
    mod.__setDefaultCartStore(mockStore as any);

    await mod.createCart();
    await mod.getCart("c1");
    await mod.setCart("c1", {});
    await mod.deleteCart("c1");
    await mod.incrementQty("c1", { id: "s1" } as any, 1, "L");
    await mod.setQty("c1", "s1", 2);
    await mod.removeItem("c1", "s1");

    expect(mockStore.createCart).toHaveBeenCalled();
    expect(mockStore.getCart).toHaveBeenCalledWith("c1");
    expect(mockStore.setCart).toHaveBeenCalledWith("c1", {});
    expect(mockStore.deleteCart).toHaveBeenCalledWith("c1");
    expect(mockStore.incrementQty).toHaveBeenCalledWith(
      "c1",
      { id: "s1" },
      1,
      "L"
    );
    expect(mockStore.setQty).toHaveBeenCalledWith("c1", "s1", 2);
    expect(mockStore.removeItem).toHaveBeenCalledWith("c1", "s1");
  });

  it("uses module.exports.createCartStore when available", async () => {
    const storeInstance = { backend: "spy" } as const;
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    const createCartStore = jest
      .fn()
      .mockReturnValue(storeInstance as any);

    // Require the module and then override the export on its module object
    const req = eval("require");
    const mod = req("../cartStore");
    req.cache[req.resolve("../cartStore")].exports.createCartStore =
      createCartStore;

    const store = mod.getDefaultCartStore();

    expect(createCartStore).toHaveBeenCalledTimes(1);
    expect(store).toBe(storeInstance);
  });
});

