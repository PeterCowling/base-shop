import { jest } from "@jest/globals";

import { RedisCartStore } from "../redisStore";
import { MemoryCartStore } from "../memoryStore";
import type { SKU } from "@acme/types";

class MockRedis {
  fail = false;
  data = new Map<string, Record<string, any>>();

  hset = jest.fn(async (key: string, value: Record<string, any>) => {
    if (this.fail) throw new Error("fail");
    const obj = this.data.get(key) ?? {};
    Object.assign(obj, value);
    this.data.set(key, obj);
    return 1;
  });

  hgetall = jest.fn(async (key: string) => {
    if (this.fail) throw new Error("fail");
    return this.data.get(key) ?? {};
  });

  expire = jest.fn(async (_key: string, _ttl: number) => {
    if (this.fail) throw new Error("fail");
    return 1;
  });

  del = jest.fn(async (key: string) => {
    if (this.fail) throw new Error("fail");
    this.data.delete(key);
    return 1;
  });

  hdel = jest.fn(async (key: string, field: string) => {
    if (this.fail) throw new Error("fail");
    const obj = this.data.get(key) ?? {};
    const existed = obj[field] !== undefined ? 1 : 0;
    delete obj[field];
    this.data.set(key, obj);
    return existed;
  });

  hincrby = jest.fn(async (key: string, field: string, qty: number) => {
    if (this.fail) throw new Error("fail");
    const obj = this.data.get(key) ?? {};
    obj[field] = (obj[field] ?? 0) + qty;
    this.data.set(key, obj);
    return obj[field];
  });

  hexists = jest.fn(async (key: string, field: string) => {
    if (this.fail) throw new Error("fail");
    const obj = this.data.get(key) ?? {};
    return obj[field] !== undefined ? 1 : 0;
  });
}

describe("RedisCartStore", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("performs operations with successful Redis calls", async () => {
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(60);
    const store = new RedisCartStore(redis as any, 60, fallback);

    const id = await store.createCart();
    expect(typeof id).toBe("string");
    expect(await store.getCart(id)).toEqual({});

    await store.incrementQty(id, sku, 2);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 2 },
    });

    await store.setQty(id, sku.id, 5);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 5 },
    });

    await store.removeItem(id, sku.id);
    expect(await store.getCart(id)).toEqual({});

    await store.setCart(id, { [sku.id]: { sku, qty: 3 } });
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 3 },
    });

    await store.deleteCart(id);
    expect(await store.getCart(id)).toEqual({});
  });

  it("falls back to memory store after repeated Redis failures", async () => {
    const redis = new MockRedis();
    redis.fail = true;
    const fallback = new MemoryCartStore(60);
    const store = new RedisCartStore(redis as any, 60, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 2); // triggers fallback mode

    redis.hset.mockClear();
    redis.hgetall.mockClear();
    redis.expire.mockClear();
    redis.del.mockClear();
    redis.hdel.mockClear();
    redis.hincrby.mockClear();
    redis.hexists.mockClear();

    await store.setCart(id, { [sku.id]: { sku, qty: 3 } });
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 3 },
    });

    await store.setQty(id, sku.id, 1);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 1 },
    });

    await store.removeItem(id, sku.id);
    expect(await store.getCart(id)).toEqual({});

    await store.deleteCart(id);
    expect(await store.getCart(id)).toEqual({});

    expect(redis.hset).not.toHaveBeenCalled();
    expect(redis.hgetall).not.toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
    expect(redis.hdel).not.toHaveBeenCalled();
    expect(redis.hincrby).not.toHaveBeenCalled();
    expect(redis.hexists).not.toHaveBeenCalled();
  });
});

