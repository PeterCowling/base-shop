import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";

describe("cart API edge runtime", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("throws when SKU is missing sizes", async () => {
    jest.doMock("../src/products", () => ({
      __esModule: true,
      getProductById: () => ({ id: "foo", stock: 1 }),
      PRODUCTS: [],
    }));

    const { POST } = await import("../src/cartApi");

    await expect(
      POST({
        json: async () => ({ sku: { id: "foo" }, qty: 1 }),
        cookies: { get: () => undefined },
      } as unknown as NextRequest)
    ).rejects.toThrow(/length/);
  });
});
