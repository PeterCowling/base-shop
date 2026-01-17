import { jest } from "@jest/globals";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import type { SKU } from "@acme/types";
import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – fallback: incrementQty when hincrby fails once", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("falls back on incrementQty when hincrby fails once", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    const spy = jest.spyOn(fallback, "incrementQty");
    redis.hincrby.mockRejectedValueOnce(new Error("fail"));
    await store.incrementQty(id, sku, 1);
    expect(spy).toHaveBeenCalledTimes(1);

    await store.incrementQty(id, sku, 1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(redis.hincrby.mock.calls.length).toBeGreaterThan(1);
  });
});

