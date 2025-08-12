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

describe("createCartStore backend selection", () => {
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
    delete process.env.SESSION_STORE;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("uses memory backend when Redis env vars are missing", async () => {
    process.env.STRIPE_SECRET_KEY = "test";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
    process.env.CART_COOKIE_SECRET = "test";
    const { createCartStore } = await import("../../src/cartStore");
    createCartStore();
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("uses redis backend when Redis env vars are provided", async () => {
    process.env.STRIPE_SECRET_KEY = "test";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
    process.env.CART_COOKIE_SECRET = "test";
    process.env.UPSTASH_REDIS_REST_URL = "url";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const { createCartStore } = await import("../../src/cartStore");
    createCartStore();
    expect(RedisMock).toHaveBeenCalledTimes(1);
  });
});

