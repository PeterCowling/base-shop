import { jest } from "@jest/globals";

import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import type { SKU } from "@acme/types";

import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – deserialization", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("deserializes cart lines from Redis hashes", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = "cart-id";
    redis.hgetall
      .mockResolvedValueOnce({ [sku.id]: 2 })
      .mockResolvedValueOnce({ [sku.id]: JSON.stringify({ sku }) });
    await expect(store.getCart(id)).resolves.toEqual({
      [sku.id]: { sku, qty: 2 },
    });
    expect(redis.hgetall).toHaveBeenCalledTimes(2);
  });
});

