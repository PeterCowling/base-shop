import { jest } from "@jest/globals";
import { RedisCartStore } from "@platform-core/cartStore/redisStore";
import { MemoryCartStore } from "@platform-core/cartStore/memoryStore";
import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – removeItem hdel=0", () => {
  it("returns null when removeItem hdel resolves 0", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);
    const id = await store.createCart();
    await expect(store.removeItem(id, "missing")).resolves.toBeNull();
  });
});

