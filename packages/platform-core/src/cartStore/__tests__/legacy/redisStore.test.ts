import { jest } from "@jest/globals";

import type { SKU } from "@acme/types";

import { MemoryCartStore } from "../../memoryStore";
import { RedisCartStore } from "../../redisStore";

const MAX_REDIS_FAILURES = 3;

// Silence expected error output from RedisCartStore during tests
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

class MockRedis {
  private failCount = 0;
  constructor(private failUntil = 0) {}

  data = new Map<string, Record<string, any>>();
  expires = new Map<string, number>();

  private maybeFail() {
    if (this.failCount < this.failUntil) {
      this.failCount += 1;
      throw new Error("fail");
    }
  }

  private isExpired(key: string) {
    const exp = this.expires.get(key);
    if (exp && Date.now() > exp) {
      this.data.delete(key);
      this.expires.delete(key);
      return true;
    }
    return false;
  }

  hset = jest.fn(async (key: string, value: Record<string, any>) => {
    this.maybeFail();
    this.isExpired(key);
    const obj = this.data.get(key) ?? {};
    Object.assign(obj, value);
    this.data.set(key, obj);
    return 1;
  });

  hgetall = jest.fn(async (key: string) => {
    this.maybeFail();
    if (this.isExpired(key)) return undefined;
    return this.data.get(key) ?? {};
  });

  expire = jest.fn(async (key: string, ttl: number) => {
    this.maybeFail();
    this.expires.set(key, Date.now() + ttl * 1000);
    return 1;
  });

  del = jest.fn(async (key: string) => {
    this.maybeFail();
    this.data.delete(key);
    this.expires.delete(key);
    return 1;
  });

  hdel = jest.fn(async (key: string, field: string) => {
    this.maybeFail();
    this.isExpired(key);
    const obj = this.data.get(key) ?? {};
    const existed = obj[field] !== undefined ? 1 : 0;
    delete obj[field];
    this.data.set(key, obj);
    return existed;
  });

  hincrby = jest.fn(async (key: string, field: string, qty: number) => {
    this.maybeFail();
    this.isExpired(key);
    const obj = this.data.get(key) ?? {};
    obj[field] = (obj[field] ?? 0) + qty;
    this.data.set(key, obj);
    return obj[field];
  });

  hexists = jest.fn(async (key: string, field: string) => {
    this.maybeFail();
    this.isExpired(key);
    const obj = this.data.get(key) ?? {};
    return obj[field] !== undefined ? 1 : 0;
  });
}

describe("RedisCartStore mocks", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("falls back to MemoryCartStore after three consecutive failures", async () => {
    const ttl = 60;
    const redis = new MockRedis(MAX_REDIS_FAILURES);
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 1); // triggers third failure

    const spies = {
      createCart: jest.spyOn(fallback, "createCart"),
      getCart: jest.spyOn(fallback, "getCart"),
      setCart: jest.spyOn(fallback, "setCart"),
      incrementQty: jest.spyOn(fallback, "incrementQty"),
    } as const;

    redis.hset.mockClear();
    redis.hgetall.mockClear();
    redis.expire.mockClear();
    redis.del.mockClear();
    redis.hincrby.mockClear();

    await store.createCart();
    await store.getCart(id);
    await store.setCart(id, {});
    await store.incrementQty(id, sku, 1);

    expect(spies.createCart).toHaveBeenCalled();
    expect(spies.getCart).toHaveBeenCalled();
    expect(spies.setCart).toHaveBeenCalled();
    expect(spies.incrementQty).toHaveBeenCalled();

    expect(redis.hset).not.toHaveBeenCalled();
    expect(redis.hgetall).not.toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
    expect(redis.hincrby).not.toHaveBeenCalled();
  });

  it("delegates to fallback when Redis returns undefined", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();

    const getSpy = jest.spyOn(fallback, "getCart");
    const setSpy = jest.spyOn(fallback, "setCart");
    const incSpy = jest.spyOn(fallback, "incrementQty");

    redis.hgetall.mockResolvedValueOnce(undefined as any);
    await store.getCart(id);
    expect(getSpy).toHaveBeenCalled();

    redis.del.mockResolvedValueOnce(undefined as any);
    await store.setCart(id, {});
    expect(setSpy).toHaveBeenCalled();

    redis.hincrby.mockResolvedValueOnce(undefined as any);
    await store.incrementQty(id, sku, 1);
    expect(incSpy).toHaveBeenCalled();
  });

  it("refreshes TTL and serializes cart lines on success", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 2, "L");

    expect(redis.expire).toHaveBeenCalledTimes(3);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);

    const key = `${sku.id}:L`;
    expect(redis.hset).toHaveBeenCalledWith(`${id}:sku`, {
      [key]: JSON.stringify({ sku, size: "L" }),
    });
    expect(await store.getCart(id)).toEqual({
      [key]: { sku, size: "L", qty: 2 },
    });
  });

  it("uses fallback store when keys expire", async () => {
    jest.useFakeTimers();
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 1);

    const getSpy = jest.spyOn(fallback, "getCart");

    jest.advanceTimersByTime(ttl * 1000 + 1);
    await expect(store.getCart(id)).resolves.toEqual({});
    expect(getSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
