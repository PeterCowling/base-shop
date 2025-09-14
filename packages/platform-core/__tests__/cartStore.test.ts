// packages/platform-core/__tests__/cartStore.test.ts
import { jest } from "@jest/globals";

const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";

const hsetMock = jest.fn();
const hgetallMock = jest.fn();
const expireMock = jest.fn();
const delMock = jest.fn();
const hdelMock = jest.fn();
const hincrbyMock = jest.fn();
const hexistsMock = jest.fn();
const RedisMock = jest.fn(() => ({
  hset: hsetMock,
  hgetall: hgetallMock,
  expire: expireMock,
  del: delMock,
  hdel: hdelMock,
  hincrby: hincrbyMock,
  hexists: hexistsMock,
}));

jest.mock("@upstash/redis", () => ({ Redis: RedisMock }));

describe("MemoryCartStore", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    RedisMock.mockClear();
    hsetMock.mockClear();
    hgetallMock.mockClear();
    expireMock.mockClear();
    delMock.mockClear();
    hdelMock.mockClear();
    hincrbyMock.mockClear();
    hexistsMock.mockClear();
    process.env.CART_TTL = "1";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.CART_TTL;
  });

  it("expires entries after TTL_SECONDS and CRUD operations after expiration behave correctly", async () => {
    const { createCart, setCart, getCart, deleteCart } = await import("../src/cartStore");

    const id = await createCart();
    await setCart(id, { foo: "bar" } as any);
    expect(await getCart(id)).toEqual({ foo: "bar" });

    jest.advanceTimersByTime(1001);

    expect(await getCart(id)).toEqual({});

    await deleteCart(id);
    expect(await getCart(id)).toEqual({});

    await setCart(id, { foo: "baz" } as any);
    expect(await getCart(id)).toEqual({ foo: "baz" });

    jest.advanceTimersByTime(1001);
    expect(await getCart(id)).toEqual({});
    expect(RedisMock).not.toHaveBeenCalled();
  });
});

describe("RedisCartStore", () => {
  beforeEach(() => {
    jest.resetModules();
    RedisMock.mockClear();
    hsetMock.mockClear();
    hgetallMock.mockClear();
    expireMock.mockClear();
    delMock.mockClear();
    hdelMock.mockClear();
    hincrbyMock.mockClear();
    hexistsMock.mockClear();
    process.env.UPSTASH_REDIS_REST_URL = "http://localhost";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;
    process.env.CART_TTL = "1";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.CART_TTL;
  });

  it("applies TTL via expire", async () => {
    const { createCart, setCart } = await import("../src/cartStore");

    await createCart();
    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(hsetMock).toHaveBeenCalledWith(expect.any(String), {});
    expect(expireMock).toHaveBeenCalledWith(expect.any(String), 1);

    await setCart("bcd", { test: 1 } as any);
    expect(expireMock).toHaveBeenCalledWith("bcd", 1);
    expect(expireMock).toHaveBeenLastCalledWith("bcd:sku", 1);
  });
});

describe("createCart backend selection", () => {
  beforeEach(() => {
    jest.resetModules();
    RedisMock.mockClear();
    hsetMock.mockClear();
    hgetallMock.mockClear();
    expireMock.mockClear();
    delMock.mockClear();
    hdelMock.mockClear();
    hincrbyMock.mockClear();
    hexistsMock.mockClear();
    delete process.env.CART_TTL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("uses memory backend when Redis env vars are missing", async () => {
    process.env.CART_TTL = "1";
    const { createCart } = await import("../src/cartStore");
    await createCart();
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("uses redis backend when Redis env vars are provided", async () => {
    process.env.CART_TTL = "1";
    process.env.UPSTASH_REDIS_REST_URL = "http://localhost";
    process.env.UPSTASH_REDIS_REST_TOKEN = STRONG_TOKEN;
    const { createCart } = await import("../src/cartStore");
    await createCart();
    expect(RedisMock).toHaveBeenCalledTimes(1);
  });
});

describe("cartStore item operations", () => {
  it("merges carts with overlapping and distinct items", async () => {
    const mod: any = await import("../src/cartStore");
    if (!mod.mergeCarts) return;

    const skuA = { id: "a", stock: 5 } as const;
    const skuB = { id: "b", stock: 5 } as const;

    const cart1 = { [skuA.id]: { sku: skuA, qty: 1 } };
    const cart2 = {
      [skuA.id]: { sku: skuA, qty: 2 },
      [skuB.id]: { sku: skuB, qty: 1 },
    };
    const mergedOverlap = mod.mergeCarts(cart1, cart2);
    expect(mergedOverlap).toEqual({
      [skuA.id]: { sku: skuA, qty: 3 },
      [skuB.id]: { sku: skuB, qty: 1 },
    });

    const cart3 = { [skuA.id]: { sku: skuA, qty: 1 } };
    const cart4 = { [skuB.id]: { sku: skuB, qty: 2 } };
    const mergedDistinct = mod.mergeCarts(cart3, cart4);
    expect(mergedDistinct).toEqual({
      [skuA.id]: { sku: skuA, qty: 1 },
      [skuB.id]: { sku: skuB, qty: 2 },
    });
  });

  it("removes existing items and returns null for missing ones", async () => {
    const mod: any = await import("../src/cartStore");
    const sku = { id: "s1", stock: 5 } as const;
    const id = await mod.createCart();
    await mod.incrementQty(id, sku, 2);

    const updated = await mod.removeItem(id, sku.id);
    expect(updated).toEqual({});

    const missing = await mod.removeItem(id, "missing");
    expect(missing).toBeNull();
  });

  it("throws when adding items beyond available stock", async () => {
    const mod: any = await import("../src/cartStore");
    if (!mod.addItem) return;
    const id = await mod.createCart();
    const sku = { id: "s1", stock: 1 } as const;
    await expect(mod.addItem(id, sku, 2)).rejects.toThrow();
  });
});

