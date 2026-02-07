import { jest } from "@jest/globals";

import type { SKU } from "@acme/types";

import { MemoryCartStore } from "../memoryStore";
import { RedisCartStore } from "../redisStore";

class MockRedis {
  data = new Map<string, Record<string, any>>();

  hset = jest.fn(async (key: string, value: Record<string, any>) => {
    const obj = this.data.get(key) ?? {};
    Object.assign(obj, value);
    this.data.set(key, obj);
    return 1;
  });

  hgetall = jest.fn(async (key: string) => this.data.get(key) ?? {});

  del = jest.fn(async (key: string) => {
    this.data.delete(key);
    return 1;
  });

  expire = jest.fn(async () => 1);
}

describe("RedisCartStore basic operations", () => {
  const ttl = 60;
  const sku = { id: "sku1" } as unknown as SKU;
  let redis: MockRedis;
  let fallback: MemoryCartStore;
  let store: RedisCartStore;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    redis = new MockRedis();
    fallback = new MemoryCartStore(ttl);
    store = new RedisCartStore(redis as any, ttl, fallback);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("sets and gets cart items", async () => {
    const id = await store.createCart();
    await store.setCart(id, { [sku.id]: { sku, qty: 2 } });
    const cart = await store.getCart(id);
    expect(cart).toEqual({ [sku.id]: { sku, qty: 2 } });
    expect(redis.hset).toHaveBeenCalled();
    expect(redis.hgetall).toHaveBeenCalled();
  });

  it("deletes cart items", async () => {
    const id = await store.createCart();
    await store.setCart(id, { [sku.id]: { sku, qty: 2 } });
    await store.deleteCart(id);
    const cart = await store.getCart(id);
    expect(cart).toEqual({});
    expect(redis.del).toHaveBeenCalledWith(id);
    expect(redis.del).toHaveBeenCalledWith(`${id}:sku`);
  });

  it("falls back to memory store when Redis connection fails", async () => {
    const id = await store.createCart();
    await fallback.setCart(id, { [sku.id]: { sku, qty: 1 } });
    const spy = jest.spyOn(fallback, "getCart");
    redis.hgetall.mockRejectedValueOnce(new Error("connection failed"));
    redis.hgetall.mockRejectedValueOnce(new Error("connection failed"));
    const cart = await store.getCart(id);
    expect(cart).toEqual({ [sku.id]: { sku, qty: 1 } });
    expect(spy).toHaveBeenCalled();
  });
});

