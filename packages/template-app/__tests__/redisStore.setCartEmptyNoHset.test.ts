import { jest } from "@jest/globals";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – setCart with empty cart", () => {
  it("skips hset when setCart called with empty cart", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();
    redis.hset.mockClear();
    await store.setCart(id, {});
    expect(redis.hset).not.toHaveBeenCalled();
  });
});

