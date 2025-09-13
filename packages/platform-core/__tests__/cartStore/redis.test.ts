import { jest } from "@jest/globals";

process.env.STRIPE_SECRET_KEY = "test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
process.env.CART_COOKIE_SECRET = "test";

jest.mock("@upstash/redis", () => ({ Redis: jest.fn() }));

import { createCartStore } from "../../src/cartStore";
import { RedisCartStore } from "../../src/cartStore/redisStore";
import type { CartStore } from "../../src/cartStore";

describe("RedisCartStore", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeAll(() => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const hsetMock = jest.fn();
  const hgetallMock = jest.fn();
  const expireMock = jest.fn();
  const delMock = jest.fn();
  const hdelMock = jest.fn();
  const hincrbyMock = jest.fn();
  const hexistsMock = jest.fn();
  const client = {
    hset: hsetMock,
    hgetall: hgetallMock,
    expire: expireMock,
    del: delMock,
    hdel: hdelMock,
    hincrby: hincrbyMock,
    hexists: hexistsMock,
  } as any;

  beforeEach(() => {
    hsetMock.mockReset();
    hgetallMock.mockReset();
    expireMock.mockReset();
    delMock.mockReset();
    hdelMock.mockReset();
    hincrbyMock.mockReset();
    hexistsMock.mockReset();
  });

  it("applies TTL via expire", async () => {
    const store = createCartStore({ backend: "redis", redis: client, ttlSeconds: 1 });

    await store.createCart();
    expect(hsetMock).toHaveBeenCalledWith(expect.any(String), {});
    expect(expireMock).toHaveBeenCalledWith(expect.any(String), 1);

    await store.setCart("abc", { test: 1 } as any);
    expect(expireMock).toHaveBeenCalledWith("abc", 1);
    expect(expireMock).toHaveBeenLastCalledWith("abc:sku", 1);
  });
  const makeFallback = (): jest.Mocked<CartStore> => ({
    createCart: jest.fn().mockResolvedValue("fb"),
    getCart: jest.fn().mockResolvedValue({} as any),
    setCart: jest.fn().mockResolvedValue(undefined),
    deleteCart: jest.fn().mockResolvedValue(undefined),
    incrementQty: jest.fn().mockResolvedValue({} as any),
    setQty: jest.fn().mockResolvedValue({} as any),
    removeItem: jest.fn().mockResolvedValue({} as any),
  });

  class FakeRedis {
    data: Record<string, Record<string, any>> = {};
    async hset(key: string, value: Record<string, any>) {
      this.data[key] = { ...(this.data[key] || {}), ...value };
      return 1;
    }
    async hgetall<T>(key: string): Promise<T> {
      return (this.data[key] || {}) as T;
    }
    async expire() {
      return 1;
    }
    async del(key: string) {
      delete this.data[key];
      return 1;
    }
    async hdel(key: string, field: string) {
      if (this.data[key]?.[field] !== undefined) {
        delete this.data[key][field];
        return 1;
      }
      return 0;
    }
    async hincrby(key: string, field: string, n: number) {
      const cur = Number(this.data[key]?.[field] || 0) + n;
      this.data[key] = { ...(this.data[key] || {}), [field]: cur };
      return cur;
    }
    async hexists(key: string, field: string) {
      return this.data[key]?.[field] !== undefined ? 1 : 0;
    }
  }

  it("enters fallback mode after repeated Redis failures", async () => {
    const fallback = makeFallback();
    const hset = jest.fn().mockRejectedValue(new Error("fail"));
    const expire = jest.fn().mockRejectedValue(new Error("fail"));
    const store = new RedisCartStore({ hset, expire } as any, 1, fallback);

    await store.createCart();
    await store.createCart();
    await store.createCart();
    await store.createCart();

    expect(hset).toHaveBeenCalledTimes(2);
    expect(fallback.createCart).toHaveBeenCalledTimes(4);
  });

  it("falls back when createCart fails", async () => {
    const fallback = makeFallback();
    const hset = jest.fn().mockRejectedValue(new Error("boom"));
    const expire = jest.fn();
    const store = new RedisCartStore({ hset, expire } as any, 1, fallback);
    await store.createCart();
    expect(fallback.createCart).toHaveBeenCalled();
  });

  it("falls back when getCart fails", async () => {
    const fallback = makeFallback();
    const hgetall = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({});
    const store = new RedisCartStore({ hgetall } as any, 1, fallback);
    await store.getCart("id");
    expect(fallback.getCart).toHaveBeenCalledWith("id");
  });

  it("falls back when setCart fails", async () => {
    const fallback = makeFallback();
    const del = jest.fn().mockResolvedValue(undefined);
    const store = new RedisCartStore({ del } as any, 1, fallback);
    await store.setCart("id", {} as any);
    expect(fallback.setCart).toHaveBeenCalledWith("id", {} as any);
  });

  it("falls back when incrementQty fails", async () => {
    const fallback = makeFallback();
    const hincrby = jest.fn().mockResolvedValue(undefined);
    const store = new RedisCartStore({ hincrby } as any, 1, fallback);
    await store.incrementQty("id", { id: "sku" } as any, 1);
    expect(fallback.incrementQty).toHaveBeenCalled();
  });

  it("falls back when setQty fails", async () => {
    const fallback = makeFallback();
    const hexists = jest.fn().mockResolvedValue(undefined);
    const store = new RedisCartStore({ hexists } as any, 1, fallback);
    await store.setQty("id", "sku", 1);
    expect(fallback.setQty).toHaveBeenCalled();
  });

  it("falls back when removeItem fails", async () => {
    const fallback = makeFallback();
    const hdel = jest.fn().mockResolvedValue(undefined);
    const store = new RedisCartStore({ hdel } as any, 1, fallback);
    await store.removeItem("id", "sku");
    expect(fallback.removeItem).toHaveBeenCalled();
  });

  it("delegates to fallback and returns its result when delete/expire fail", async () => {
    const fallback = makeFallback();
    const expected = { cart: true } as any;
    fallback.removeItem.mockResolvedValue(expected);
    const store = new RedisCartStore({} as any, 1, fallback);
    jest
      .spyOn(store as any, "exec")
      .mockResolvedValueOnce(1)
      .mockResolvedValue(undefined);
    const result = await store.removeItem("id", "sku");
    expect(fallback.removeItem).toHaveBeenCalledWith("id", "sku");
    expect(result).toBe(expected);
  });

  it("returns null when setting qty=0 for missing item and falls back on failure", async () => {
    const fallback = makeFallback();
    const hexists = jest.fn().mockResolvedValueOnce(0);
    const store = new RedisCartStore({ hexists } as any, 1, fallback);
    expect(await store.setQty("id", "sku", 0)).toBeNull();
    hexists.mockResolvedValueOnce(undefined);
    await store.setQty("id", "sku", 0);
    expect(fallback.setQty).toHaveBeenCalledWith("id", "sku", 0);
  });

  it("returns null when removing non-existent item and falls back on failure", async () => {
    const fallback = makeFallback();
    const hdel = jest.fn().mockResolvedValueOnce(0);
    const store = new RedisCartStore({ hdel } as any, 1, fallback);
    expect(await store.removeItem("id", "sku")).toBeNull();
    hdel.mockResolvedValueOnce(undefined);
    await store.removeItem("id", "sku");
    expect(fallback.removeItem).toHaveBeenCalledWith("id", "sku");
  });

  it("sets quantity when item exists and falls back on failure", async () => {
    const client = new FakeRedis();
    const fallback = makeFallback();
    const store = new RedisCartStore(client as any, 1, fallback);
    const sku = { id: "sku" } as any;
    const id = await store.createCart();
    await store.incrementQty(id, sku, 1);
    const cart = await store.setQty(id, sku.id, 2);
    expect(cart).toEqual({ [sku.id]: { sku, qty: 2 } });
    expect(
      Object.values(fallback).every((fn) => !(fn as jest.Mock).mock.calls.length)
    ).toBe(true);

    const fallback2 = makeFallback();
    const hexists = jest.fn().mockResolvedValue(1);
    const hset = jest.fn().mockResolvedValueOnce(undefined);
    const expire = jest.fn().mockResolvedValue(1);
    const store2 = new RedisCartStore({ hexists, hset, expire } as any, 1, fallback2);
    await store2.setQty("id2", "sku", 3);
    expect(fallback2.setQty).toHaveBeenCalledWith("id2", "sku", 3);
  });

  it("performs operations successfully when Redis succeeds", async () => {
    const client = new FakeRedis();
    const fallback = makeFallback();
    const store = new RedisCartStore(client as any, 1, fallback);
    const sku = { id: "sku" } as any;

    const id = await store.createCart();
    await store.setCart(id, { [sku.id]: { sku, qty: 1 } });
    expect(await store.getCart(id)).toEqual({ [sku.id]: { sku, qty: 1 } });
    await store.incrementQty(id, sku, 2);
    expect(await store.getCart(id)).toEqual({ [sku.id]: { sku, qty: 3 } });
    await store.setQty(id, sku.id, 5);
    expect(await store.getCart(id)).toEqual({ [sku.id]: { sku, qty: 5 } });
    await store.removeItem(id, sku.id);
    expect(await store.getCart(id)).toEqual({});
    expect(
      Object.values(fallback).every((fn) => !(fn as jest.Mock).mock.calls.length)
    ).toBe(true);
  });
});

