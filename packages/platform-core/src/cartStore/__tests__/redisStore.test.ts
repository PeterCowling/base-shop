import { jest } from "@jest/globals";

import type { SKU } from "@acme/types";

import { MemoryCartStore } from "../memoryStore";
import { RedisCartStore } from "../redisStore";

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
    expect(redis.hset).toHaveBeenCalledTimes(1);
    expect(redis.hset).toHaveBeenLastCalledWith(id, {});
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

  describe("single Redis command failures", () => {
    const ttl = 60;
    let redis: MockRedis;
    let fallback: MemoryCartStore;
    let store: RedisCartStore;
    beforeEach(() => {
      redis = new MockRedis();
      fallback = new MemoryCartStore(ttl);
      store = new RedisCartStore(redis as any, ttl, fallback);
    });

    it("falls back on createCart when hset fails once", async () => {
      const spy = jest.spyOn(fallback, "createCart");
      redis.hset.mockRejectedValueOnce(new Error("fail"));
      const id1 = await store.createCart();
      expect(typeof id1).toBe("string");
      expect(spy).toHaveBeenCalledTimes(1);

      const id2 = await store.createCart();
      expect(typeof id2).toBe("string");
      expect(spy).toHaveBeenCalledTimes(1); // fallback not entered globally
      expect(redis.hset).toHaveBeenCalledTimes(2);
    });

    it("falls back on getCart when hgetall fails once", async () => {
      const id = await store.createCart();
      const spy = jest.spyOn(fallback, "getCart");
      redis.hgetall.mockRejectedValueOnce(new Error("fail"));
      await store.getCart(id);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.getCart(id);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.hgetall.mock.calls.length).toBeGreaterThan(2);
    });

    it("falls back on setCart when del fails once", async () => {
      const id = await store.createCart();
      const cart = { [sku.id]: { sku, qty: 1 } };
      const spy = jest.spyOn(fallback, "setCart");
      redis.del.mockRejectedValueOnce(new Error("fail"));
      await store.setCart(id, cart);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.setCart(id, cart);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.del.mock.calls.length).toBeGreaterThan(2);
    });

    it("falls back on setCart when expire fails once", async () => {
      const id = await store.createCart();
      const cart = { [sku.id]: { sku, qty: 1 } };
      const spy = jest.spyOn(fallback, "setCart");
      redis.expire.mockRejectedValueOnce(new Error("fail"));
      await store.setCart(id, cart);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.setCart(id, cart);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.expire.mock.calls.length).toBeGreaterThan(2);
    });

    it("falls back on incrementQty when hincrby fails once", async () => {
      const id = await store.createCart();
      const spy = jest.spyOn(fallback, "incrementQty");
      redis.hincrby.mockRejectedValueOnce(new Error("fail"));
      await store.incrementQty(id, sku, 1);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.incrementQty(id, sku, 1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.hincrby.mock.calls.length).toBeGreaterThan(1);
    });

    it("falls back on setQty when hexists fails once", async () => {
      const id = await store.createCart();
      await store.incrementQty(id, sku, 1);
      const spy = jest.spyOn(fallback, "setQty");
      redis.hexists.mockRejectedValueOnce(new Error("fail"));
      await store.setQty(id, sku.id, 2);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.setQty(id, sku.id, 3);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.hexists.mock.calls.length).toBeGreaterThan(1);
    });

    it("falls back on removeItem when hdel fails once", async () => {
      const id = await store.createCart();
      await store.incrementQty(id, sku, 1);
      const spy = jest.spyOn(fallback, "removeItem");
      redis.hdel.mockRejectedValueOnce(new Error("fail"));
      await store.removeItem(id, sku.id);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.removeItem(id, sku.id);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.hdel.mock.calls.length).toBeGreaterThan(1);
    });

    it("falls back on deleteCart when del fails once", async () => {
      const id = await store.createCart();
      const spy = jest.spyOn(fallback, "deleteCart");
      redis.del.mockRejectedValueOnce(new Error("fail"));
      await store.deleteCart(id);
      expect(spy).toHaveBeenCalledTimes(1);

      await store.deleteCart(id);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(redis.del.mock.calls.length).toBeGreaterThan(2);
    });
  });

  it("skips hset when setCart called with empty cart", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();
    redis.hset.mockClear();
    await store.setCart(id, {});
    expect(redis.hset).not.toHaveBeenCalled();
  });

  it("returns null when setQty hexists resolves 0", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();
    await expect(store.setQty(id, "missing", 1)).resolves.toBeNull();
  });

  it("returns null when removeItem hdel resolves 0", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();
    await expect(store.removeItem(id, "missing")).resolves.toBeNull();
  });

  it("delegates to fallback store when Redis fails repeatedly", async () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const redis = new MockRedis(MAX_REDIS_FAILURES);
    const fallback = new MemoryCartStore(60);
    const store = new RedisCartStore(redis as any, 60, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 2); // trigger fallback
    expect(errorSpy).toHaveBeenCalledWith(
      "Falling back to MemoryCartStore after repeated Redis failures",
    );

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

    errorSpy.mockRestore();
  });
});

