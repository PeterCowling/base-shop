import { jest } from "@jest/globals";

import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";

import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – fallback: getCart when hgetall fails once", () => {
  it("falls back on getCart when hgetall fails once", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    const spy = jest.spyOn(fallback, "getCart");
    redis.hgetall.mockRejectedValueOnce(new Error("fail"));
    await store.getCart(id);
    expect(spy).toHaveBeenCalledTimes(1);

    await store.getCart(id);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(redis.hgetall.mock.calls.length).toBeGreaterThan(2);
  });
});

