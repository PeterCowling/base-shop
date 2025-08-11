// packages/platform-core/__tests__/cartStore.test.ts
import { jest } from "@jest/globals";

const setMock = jest.fn();
const getMock = jest.fn();
const delMock = jest.fn();
const RedisMock = jest.fn(() => ({ set: setMock, get: getMock, del: delMock }));

jest.mock("@upstash/redis", () => ({ Redis: RedisMock }));

describe("MemoryCartStore", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    RedisMock.mockClear();
    setMock.mockClear();
    getMock.mockClear();
    delMock.mockClear();
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
    setMock.mockClear();
    getMock.mockClear();
    delMock.mockClear();
    process.env.UPSTASH_REDIS_REST_URL = "http://localhost";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.CART_TTL = "1";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.CART_TTL;
  });

  it("passes TTL via ex option", async () => {
    const { createCart, setCart } = await import("../src/cartStore");

    await createCart();
    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith(expect.any(String), {}, { ex: 1 });

    await setCart("abc", { test: 1 } as any);
    expect(setMock).toHaveBeenLastCalledWith("abc", { test: 1 }, { ex: 1 });
  });
});

describe("createCart backend selection", () => {
  beforeEach(() => {
    jest.resetModules();
    RedisMock.mockClear();
    setMock.mockClear();
    getMock.mockClear();
    delMock.mockClear();
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
    process.env.UPSTASH_REDIS_REST_URL = "url";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const { createCart } = await import("../src/cartStore");
    await createCart();
    expect(RedisMock).toHaveBeenCalledTimes(1);
  });
});

