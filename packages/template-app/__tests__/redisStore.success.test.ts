import { jest } from "@jest/globals";

import { MemoryCartStore } from "@acme/platform-core/cartStore/memoryStore";
import { RedisCartStore } from "@acme/platform-core/cartStore/redisStore";
import type { SKU } from "@acme/types";

import { MockRedis } from "./helpers/mockRedis";

describe("RedisCartStore – success path + TTL", () => {
  const sku = { id: "sku1" } as unknown as SKU;

  it("performs operations with successful Redis calls and refreshes TTL", async () => {
    const ttl = 60;
    const redis = new MockRedis();
    const fallback = new MemoryCartStore(ttl);
    const store = new RedisCartStore(redis as any, ttl, fallback);

    const id = await store.createCart();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(redis.hset).toHaveBeenCalledTimes(1);
    expect(redis.hset).toHaveBeenLastCalledWith(id, {});
    expect(redis.expire).toHaveBeenCalledTimes(1);
    expect(redis.expire).toHaveBeenLastCalledWith(id, ttl);
    expect(await store.getCart(id)).toEqual({});

    expect(await store.setQty(id, "missing", 1)).toBeNull();
    expect(redis.expire).toHaveBeenCalledTimes(1);
    expect(redis.hexists).toHaveBeenCalledWith(id, "missing");

    await store.incrementQty(id, sku, 2);
    expect(redis.expire).toHaveBeenCalledTimes(3);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 2 },
    });

    await store.setQty(id, sku.id, 5);
    expect(redis.expire).toHaveBeenCalledTimes(5);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 5 },
    });

    await store.setQty(id, sku.id, 0);
    expect(redis.expire).toHaveBeenCalledTimes(7);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({});

    await expect(store.removeItem(id, sku.id)).resolves.toBeNull();
    expect(redis.expire).toHaveBeenCalledTimes(7);
    expect(await store.getCart(id)).toEqual({});

    await store.setCart(id, { [sku.id]: { sku, qty: 3 } });
    expect(redis.expire).toHaveBeenCalledTimes(9);
    expect(redis.expire.mock.calls.slice(-2)).toEqual([
      [id, ttl],
      [`${id}:sku`, ttl],
    ]);
    expect(await store.getCart(id)).toEqual({
      [sku.id]: { sku, qty: 3 },
    });

    await store.deleteCart(id);
    expect(redis.expire).toHaveBeenCalledTimes(9);
    expect(await store.getCart(id)).toEqual({});
  });
});

