import { jest } from "@jest/globals";

import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import type { SKU } from "@acme/types";

import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – fallback: setCart when del fails once", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("falls back on setCart when del fails once", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

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
});

