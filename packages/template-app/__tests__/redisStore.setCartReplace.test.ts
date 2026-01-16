import { jest } from "@jest/globals";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import type { SKU } from "@acme/types";
import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – setCart replacement", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("setCart replaces existing hashes and refreshes TTL", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();
    redis.hset.mockClear();
    redis.del.mockClear();
    redis.expire.mockClear();
    const cart = { [sku.id]: { sku, qty: 1 } };
    await store.setCart(id, cart);
    expect(redis.del).toHaveBeenNthCalledWith(1, id);
    expect(redis.del).toHaveBeenNthCalledWith(2, `${id}:sku`);
    expect(redis.hset).toHaveBeenCalledWith(id, { [sku.id]: 1 });
    expect(redis.hset).toHaveBeenCalledWith(`${id}:sku`, {
      [sku.id]: JSON.stringify({ sku }),
    });
    expect(redis.expire).toHaveBeenCalledWith(id, ttl);
    expect(redis.expire).toHaveBeenCalledWith(`${id}:sku`, ttl);
  });
});

