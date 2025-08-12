import { jest } from "@jest/globals";

process.env.STRIPE_SECRET_KEY = "test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
process.env.CART_COOKIE_SECRET = "test";

jest.mock("@upstash/redis", () => ({ Redis: jest.fn() }));

import { createCartStore } from "../../src/cartStore";

describe("RedisCartStore", () => {
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
});

