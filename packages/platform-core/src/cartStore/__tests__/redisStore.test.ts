import { jest } from "@jest/globals";

import { RedisCartStore } from "../redisStore";
import { MemoryCartStore } from "../memoryStore";
import type { SKU } from "@acme/types";

const MAX_REDIS_FAILURES = 3;

class MockRedis {
  private failCount = 0;
  constructor(private failUntil = 0) {}

  data = new Map<string, Record<string, any>>();

  private maybeFail() {
    if (this.failCount < this.failUntil) {
      this.failCount += 1;
      throw new Error("fail");
    }
  }

  hset = jest.fn(async (key: string, value: Record<string, any>) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    Object.assign(obj, value);
    this.data.set(key, obj);
    return 1;
  });

  hgetall = jest.fn(async (key: string) => {
    this.maybeFail();
    return this.data.get(key) ?? {};
  });

  expire = jest.fn(async (_key: string, _ttl: number) => {
    this.maybeFail();
    return 1;
  });

  del = jest.fn(async (key: string) => {
    this.maybeFail();
    this.data.delete(key);
    return 1;
  });

  hdel = jest.fn(async (key: string, field: string) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    const existed = obj[field] !== undefined ? 1 : 0;
    delete obj[field];
    this.data.set(key, obj);
    return existed;
  });

  hincrby = jest.fn(async (key: string, field: string, qty: number) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    obj[field] = (obj[field] ?? 0) + qty;
    this.data.set(key, obj);
    return obj[field];
  });

  hexists = jest.fn(async (key: string, field: string) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    return obj[field] !== undefined ? 1 : 0;
  });
}

describe("RedisCartStore", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("performs operations with successful Redis calls and refreshes TTL", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    expect(typeof id).toBe("string");
    expect(redis.expire).toHaveBeenCalledTimes(1);
    expect(redis.expire).toHaveBeenLastCalledWith(id, ttl);
    expect(await store.getCart(id)).toEqual({});

    expect(await store.setQty(id, "missing", 1)).toBeNull();
    expect(redis.expire).toHaveBeenCalledTimes(1);
    expect(redis.hexists).toHaveBeenCalledWith(id, "missing");

    await store.incrementQty(id, sku, 2);
    expect(redis.expire).toHaveBeenCalledTimes(3);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 2 },
    });

    await store.setQty(id, sku.id, 5);
    expect(redis.expire).toHaveBeenCalledTimes(5);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 5 },
    });

    await store.setQty(id, sku.id, 0);
    expect(redis.expire).toHaveBeenCalledTimes(7);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({});

    await expect(store.removeItem(id, sku.id)).resolves.toBeNull();
    expect(redis.expire).toHaveBeenCalledTimes(7);
    expect(await store.getCart(id)).toEqual({});

    await store.setCart(id, { [sku.id]: { sku, qty: 3 } });
    expect(redis.expire).toHaveBeenCalledTimes(9);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 3 },
    });

    await store.deleteCart(id);
    expect(redis.expire).toHaveBeenCalledTimes(9);
    expect(await store.getCart(id)).toEqual({});
  });

  it("delegates to fallback store when Redis fails repeatedly", async () => {
    const redis = new MockRedis(MAX_REDIS_FAILURES);
    const fallback = new MemoryCartStore(60);
    const store = new RedisCartStore(redis as any, 60, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 2); // trigger fallback

    const spies = {
      createCart: jest.spyOn(fallback, "createCart"),
      getCart: jest.spyOn(fallback, "getCart"),
      setCart: jest.spyOn(fallback, "setCart"),
      incrementQty: jest.spyOn(fallback, "incrementQty"),
      setQty: jest.spyOn(fallback, "setQty"),
      removeItem: jest.spyOn(fallback, "removeItem"),
      deleteCart: jest.spyOn(fallback, "deleteCart"),
    } as const;

    redis.hset.mockClear();
    redis.hgetall.mockClear();
    redis.expire.mockClear();
    redis.del.mockClear();
    redis.hdel.mockClear();
    redis.hincrby.mockClear();
    redis.hexists.mockClear();

    await store.createCart();
    await store.getCart(id);
    await store.setCart(id, { [sku.id]: { sku, qty: 3 } });
    await store.incrementQty(id, sku, 1);
    await store.setQty(id, sku.id, 1);
    await store.removeItem(id, sku.id);
    await store.deleteCart(id);

    expect(spies.createCart).toHaveBeenCalled();
    expect(spies.getCart).toHaveBeenCalled();
    expect(spies.setCart).toHaveBeenCalled();
    expect(spies.incrementQty).toHaveBeenCalled();
    expect(spies.setQty).toHaveBeenCalled();
    expect(spies.removeItem).toHaveBeenCalled();
    expect(spies.deleteCart).toHaveBeenCalled();

    expect(redis.hset).not.toHaveBeenCalled();
    expect(redis.hgetall).not.toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
    expect(redis.hdel).not.toHaveBeenCalled();
    expect(redis.hincrby).not.toHaveBeenCalled();
    expect(redis.hexists).not.toHaveBeenCalled();
  });
});

