import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import crypto from "crypto";
import type { SKU } from "@acme/types";
import type { CartStore } from "../cartStore";
import { RedisCartStore } from "./redisStore";

const ttl = 60;

function createClient() {
  return {
    hset: jest.fn().mockResolvedValue("OK"),
    hgetall: jest.fn().mockResolvedValue({}),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    hincrby: jest.fn().mockResolvedValue(1),
    hexists: jest.fn().mockResolvedValue(1),
    hdel: jest.fn().mockResolvedValue(1),
  } as const;
}

function createFallback(): jest.Mocked<CartStore> {
  return {
    createCart: jest.fn().mockResolvedValue("fb"),
    getCart: jest.fn().mockResolvedValue({}),
    setCart: jest.fn().mockResolvedValue(),
    deleteCart: jest.fn().mockResolvedValue(),
    incrementQty: jest.fn().mockResolvedValue({}),
    setQty: jest.fn().mockResolvedValue({}),
    removeItem: jest.fn().mockResolvedValue({}),
  };
}

describe("RedisCartStore", () => {
  let client: ReturnType<typeof createClient>;
  let fallback: jest.Mocked<CartStore>;
  let store: RedisCartStore;
  const sku: SKU = { id: "sku1" };

  beforeEach(() => {
    client = createClient();
    fallback = createFallback();
    store = new RedisCartStore(client as any, ttl, fallback);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates Redis on createCart", async () => {
    jest.spyOn(crypto, "randomUUID").mockReturnValue("cart1");
    const id = await store.createCart();
    expect(id).toBe("cart1");
    expect(client.hset).toHaveBeenCalledWith("cart1", {});
    expect(client.expire).toHaveBeenCalledWith("cart1", ttl);
    expect(fallback.createCart).not.toHaveBeenCalled();
  });

  it("updates Redis on setCart", async () => {
    const cart = { line1: { sku, qty: 2 } };
    await store.setCart("cart1", cart);
    expect(client.del).toHaveBeenCalledWith("cart1");
    expect(client.del).toHaveBeenCalledWith("cart1:sku");
    expect(client.hset).toHaveBeenCalledWith("cart1", { line1: 2 });
    expect(client.hset).toHaveBeenCalledWith("cart1:sku", {
      line1: JSON.stringify({ sku, size: undefined }),
    });
    expect(client.expire).toHaveBeenCalledWith("cart1", ttl);
    expect(client.expire).toHaveBeenCalledWith("cart1:sku", ttl);
    expect(fallback.setCart).not.toHaveBeenCalled();
  });

  it("updates Redis on incrementQty", async () => {
    await store.incrementQty("cart1", sku, 1);
    expect(client.hincrby).toHaveBeenCalledWith("cart1", sku.id, 1);
    expect(client.hset).toHaveBeenCalledWith("cart1:sku", {
      [sku.id!]: JSON.stringify({ sku, size: undefined }),
    });
    expect(client.expire).toHaveBeenCalledWith("cart1", ttl);
    expect(client.expire).toHaveBeenCalledWith("cart1:sku", ttl);
    expect(fallback.incrementQty).not.toHaveBeenCalled();
  });

  it("updates Redis on setQty", async () => {
    await store.setQty("cart1", sku.id!, 3);
    expect(client.hexists).toHaveBeenCalledWith("cart1", sku.id);
    expect(client.hset).toHaveBeenCalledWith("cart1", { [sku.id!]: 3 });
    expect(client.expire).toHaveBeenCalledWith("cart1", ttl);
    expect(client.expire).toHaveBeenCalledWith("cart1:sku", ttl);
    expect(fallback.setQty).not.toHaveBeenCalled();
  });

  it("updates Redis on removeItem", async () => {
    await store.removeItem("cart1", sku.id!);
    expect(client.hdel).toHaveBeenCalledWith("cart1", sku.id);
    expect(client.hdel).toHaveBeenCalledWith("cart1:sku", sku.id);
    expect(client.expire).toHaveBeenCalledWith("cart1", ttl);
    expect(client.expire).toHaveBeenCalledWith("cart1:sku", ttl);
    expect(fallback.removeItem).not.toHaveBeenCalled();
  });

  it("falls back after repeated Redis failures", async () => {
    const failing = {
      hset: jest.fn().mockRejectedValue(new Error("fail")),
      hgetall: jest.fn().mockRejectedValue(new Error("fail")),
      expire: jest.fn().mockRejectedValue(new Error("fail")),
      del: jest.fn().mockRejectedValue(new Error("fail")),
      hincrby: jest.fn().mockRejectedValue(new Error("fail")),
      hexists: jest.fn().mockRejectedValue(new Error("fail")),
      hdel: jest.fn().mockRejectedValue(new Error("fail")),
    };
    const fb = createFallback();
    const store2 = new RedisCartStore(failing as any, ttl, fb);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await store2.createCart(); // 2 failures
    await store2.getCart("cart1"); // triggers fallback mode

    await store2.incrementQty("cart1", sku, 1);
    expect(fb.incrementQty).toHaveBeenCalledWith("cart1", sku, 1, undefined);
    expect(failing.hincrby).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

