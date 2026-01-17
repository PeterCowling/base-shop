import { jest } from "@jest/globals";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – fallback: deleteCart when del fails once", () => {
  it("falls back on deleteCart when del fails once", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    const spy = jest.spyOn(fallback, "deleteCart");
    redis.del.mockRejectedValueOnce(new Error("fail"));
    await store.deleteCart(id);
    expect(spy).toHaveBeenCalledTimes(1);

    await store.deleteCart(id);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(redis.del.mock.calls.length).toBeGreaterThan(2);
  });
});

