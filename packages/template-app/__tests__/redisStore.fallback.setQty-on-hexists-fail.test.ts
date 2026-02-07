import { jest } from "@jest/globals";

import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import type { SKU } from "@acme/types";

import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – fallback: setQty when hexists fails once", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("falls back on setQty when hexists fails once", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

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
});

