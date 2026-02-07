import { jest } from "@jest/globals";

import { createCartStore } from "../../src/cartStore";

process.env.STRIPE_SECRET_KEY = "test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
process.env.CART_COOKIE_SECRET = "test";

jest.mock("@upstash/redis", () => ({ Redis: jest.fn() }));

describe("MemoryCartStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("expires entries after TTL and handles CRUD correctly", async () => {
    const store = createCartStore({ backend: "memory", ttlSeconds: 1 });
    const id = await store.createCart();
    await store.setCart(id, { foo: "bar" } as any);
    expect(await store.getCart(id)).toEqual({ foo: "bar" });

    jest.advanceTimersByTime(1001);
    expect(await store.getCart(id)).toEqual({});

    await store.deleteCart(id);
    expect(await store.getCart(id)).toEqual({});

    await store.setCart(id, { foo: "baz" } as any);
    expect(await store.getCart(id)).toEqual({ foo: "baz" });

    jest.advanceTimersByTime(1001);
    expect(await store.getCart(id)).toEqual({});
  });
});

