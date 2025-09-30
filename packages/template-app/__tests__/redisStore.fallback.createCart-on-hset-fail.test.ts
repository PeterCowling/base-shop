import { jest } from "@jest/globals";
import { RedisCartStore } from "@platform-core/cartStore/redisStore";
import { MemoryCartStore } from "@platform-core/cartStore/memoryStore";
import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – fallback: createCart when hset fails once", () => {
  it("falls back on createCart when hset fails once", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const spy = jest.spyOn(fallback, "createCart");
    redis.hset.mockRejectedValueOnce(new Error("fail"));
    const id1 = await store.createCart();
    expect(typeof id1).toBe("string");
    expect(spy).toHaveBeenCalledTimes(1);

    const id2 = await store.createCart();
    expect(typeof id2).toBe("string");
    expect(spy).toHaveBeenCalledTimes(1); // fallback not entered globally
    expect(redis.hset).toHaveBeenCalledTimes(2);
  });
});

