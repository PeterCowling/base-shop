import { jest } from "@jest/globals";

import { MemoryCartStore } from "../../src/cartStore/memoryStore";
import { RedisCartStore } from "../../src/cartStore/redisStore";

jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv: () => ({
    SESSION_STORE: process.env.SESSION_STORE,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CART_TTL: process.env.CART_TTL,
  }),
}));

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";

const RedisMock = jest.fn(() => ({
  hset: jest.fn(),
  hgetall: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
  hdel: jest.fn(),
  hincrby: jest.fn(),
  hexists: jest.fn(),
}));

jest.mock("@upstash/redis", () => ({ Redis: RedisMock }));

describe("createCartStore backend selection", () => {
  beforeEach(() => {
    jest.resetModules();
    RedisMock.mockClear();
    delete process.env.SESSION_STORE;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.CART_TTL;
  });

  it("honors explicit backend=memory", async () => {
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore({ backend: "memory" });
    expect(store.constructor.name).toBe("MemoryCartStore");
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("honors explicit backend=redis", async () => {
    const { createCartStore } = await import("../../src/cartStore");
    const fakeClient = {} as any;
    const store = createCartStore({ backend: "redis", redis: fakeClient });
    expect(store.constructor.name).toBe("RedisCartStore");
  });

  it("uses SESSION_STORE=memory even when redis env vars exist", async () => {
    process.env.SESSION_STORE = "memory";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("MemoryCartStore");
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("uses SESSION_STORE=redis when redis env vars exist", async () => {
    process.env.SESSION_STORE = "redis";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("RedisCartStore");
  });

  it("falls back to memory when SESSION_STORE=redis but env vars missing", async () => {
    process.env.SESSION_STORE = "redis";
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("MemoryCartStore");
  });

  it("uses redis backend when redis env vars are provided", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("RedisCartStore");
    expect(RedisMock).toHaveBeenCalled();
  });

  it("uses memory backend when redis env vars are missing", async () => {
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("MemoryCartStore");
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("applies CART_TTL env when ttlSeconds not provided", async () => {
    process.env.CART_TTL = "123";
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("MemoryCartStore");
    expect((store as any).ttl).toBe(123);
  });

  it("ttlSeconds option overrides CART_TTL env", async () => {
    process.env.CART_TTL = "123";
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore({ ttlSeconds: 456 });
    expect(store.constructor.name).toBe("MemoryCartStore");
    expect((store as any).ttl).toBe(456);
  });

  it("uses CART_TTL env when falling back from redis", async () => {
    process.env.SESSION_STORE = "redis";
    process.env.CART_TTL = "321";
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("MemoryCartStore");
    expect((store as any).ttl).toBe(321);
  });

  it("passes CART_TTL env to redis backend", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;
    process.env.CART_TTL = "77";
    const { createCartStore } = await import("../../src/cartStore");
    const store = createCartStore();
    expect(store.constructor.name).toBe("RedisCartStore");
    expect((store as any).ttl).toBe(77);
  });
});

