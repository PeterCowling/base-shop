import { jest } from "@jest/globals";

import {
  withFallback,
  expireBoth,
  skuKey,
  serialize,
  deserialize,
} from "../redisHelpers";

describe("redisHelpers", () => {
  it("withFallback calls fallback when an operation fails", async () => {
    const ops = [
      () => Promise.resolve(1),
      () => Promise.resolve(undefined),
    ];
    const fb = jest.fn(async () => "fallback");
    const res = await withFallback(ops, fb);
    expect(res).toBe("fallback");
    expect(fb).toHaveBeenCalled();
  });

  it("withFallback skips fallback when all operations succeed", async () => {
    const ops = [() => Promise.resolve(1)];
    const fb = jest.fn();
    await withFallback(ops, fb);
    expect(fb).not.toHaveBeenCalled();
  });

  it("expireBoth expires both keys and reports failure", async () => {
    const client = {
      expire: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error("fail")),
    } as any;
    const exec = async (fn: () => Promise<any>) => {
      try {
        return await fn();
      } catch {
        return undefined;
      }
    };
    const ops = expireBoth(exec, client, "a", 60, "a:sku");
    const results = await Promise.all(ops.map((op) => op()));
    expect(client.expire).toHaveBeenCalledTimes(2);
    expect(results).toEqual([1, undefined]);
  });

  it("generates sku key correctly", () => {
    expect(skuKey("cart1")).toBe("cart1:sku");
  });

  it("serializes and deserializes values", () => {
    const value = { a: 1 };
    const json = serialize(value)!;
    expect(typeof json).toBe("string");
    expect(deserialize<typeof value>(json)).toEqual(value);
  });

  it("handles undefined and null inputs", () => {
    expect(serialize(undefined)).toBeUndefined();
    expect(serialize(null)).toBeUndefined();
    expect(deserialize(undefined)).toBeUndefined();
    expect(deserialize(null)).toBeUndefined();
  });
});
