import { jest } from "@jest/globals";

import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import type { SKU } from "@acme/types";

import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – global fallback after repeated failures", () => {
  const MAX_REDIS_FAILURES = 3;
  const sku = { id: "sku1" } as unknown as SKU;

  it("delegates to fallback store when Redis fails repeatedly", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const redis = new MockRedis(MAX_REDIS_FAILURES);
    const fallback = new MemoryCartStore(60);
    const store = new RedisCartStore(redis as any, 60, fallback);

    const id = await store.createCart();
    await store.incrementQty(id, sku, 2); // trigger fallback
    expect(errorSpy).toHaveBeenCalledWith(
      "Falling back to MemoryCartStore after repeated Redis failures",
    );

    const spies = {
      createCart: jest.spyOn(fallback, "createCart"),
      getCart: jest.spyOn(fallback, "getCart"),
      setCart: jest.spyOn(fallback, "setCart"),
      incrementQty: jest.spyOn(fallback, "incrementQty"),
      setQty: jest.spyOn(fallback, "setQty"),
      removeItem: jest.spyOn(fallback, "removeItem"),
      deleteCart: jest.spyOn(fallback, "deleteCart"),
    } as const;

    redis.hset.mockClear();
    redis.hgetall.mockClear();
    redis.expire.mockClear();
    redis.del.mockClear();
    redis.hdel.mockClear();
    redis.hincrby.mockClear();
    redis.hexists.mockClear();

    await store.createCart();
    await store.getCart(id);
    await store.setCart(id, { [sku.id]: { sku, qty: 3 } });
    await store.incrementQty(id, sku, 1);
    await store.setQty(id, sku.id, 1);
    await store.removeItem(id, sku.id);
    await store.deleteCart(id);

    expect(spies.createCart).toHaveBeenCalled();
    expect(spies.getCart).toHaveBeenCalled();
    expect(spies.setCart).toHaveBeenCalled();
    expect(spies.incrementQty).toHaveBeenCalled();
    expect(spies.setQty).toHaveBeenCalled();
    expect(spies.removeItem).toHaveBeenCalled();
    expect(spies.deleteCart).toHaveBeenCalled();

    expect(redis.hset).not.toHaveBeenCalled();
    expect(redis.hgetall).not.toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
    expect(redis.hdel).not.toHaveBeenCalled();
    expect(redis.hincrby).not.toHaveBeenCalled();
    expect(redis.hexists).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

