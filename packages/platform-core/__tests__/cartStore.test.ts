// packages/platform-core/__tests__/cartStore.test.ts
import { jest } from "@jest/globals";

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
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
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

    await setCart("abc", { test: 1 } as any);
    expect(expireMock).toHaveBeenCalledWith("abc", 1);
    expect(expireMock).toHaveBeenLastCalledWith("abc:sku", 1);
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
    process.env.UPSTASH_REDIS_REST_URL = "url";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const { createCart } = await import("../src/cartStore");
    await createCart();
    expect(RedisMock).toHaveBeenCalledTimes(1);
  });
});

