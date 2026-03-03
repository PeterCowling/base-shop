import { describe, expect, it } from "@jest/globals";

import {
  cartLineId,
  cartReservedQtyForSku,
  cartReservedQtyForSkuExcluding,
  type XaCartState,
} from "../xaCart";

const productA = { id: "sku-a" } as const;
const productB = { id: "sku-b" } as const;

describe("xaCart helpers", () => {
  it("builds stable line ids with and without size", () => {
    expect(cartLineId("sku-a")).toBe("sku-a");
    expect(cartLineId("sku-a", "M")).toBe("sku-a:M");
  });

  it("sums reserved quantity for a given sku", () => {
    const cart: XaCartState = {
      "sku-a:S": { sku: productA as never, qty: 1, size: "S" },
      "sku-a:M": { sku: productA as never, qty: 2, size: "M" },
      "sku-b:L": { sku: productB as never, qty: 5, size: "L" },
    };

    expect(cartReservedQtyForSku(cart, "sku-a")).toBe(3);
    expect(cartReservedQtyForSku(cart, "sku-b")).toBe(5);
    expect(cartReservedQtyForSku(cart, "missing")).toBe(0);
  });

  it("excludes a specific line from reserved quantity totals", () => {
    const cart: XaCartState = {
      "sku-a:S": { sku: productA as never, qty: 1, size: "S" },
      "sku-a:M": { sku: productA as never, qty: 2, size: "M" },
      "sku-a:L": { sku: productA as never, qty: 3, size: "L" },
    };

    expect(cartReservedQtyForSkuExcluding(cart, "sku-a", "sku-a:M")).toBe(4);
    expect(cartReservedQtyForSkuExcluding(cart, "sku-a", "missing-line")).toBe(6);
  });
});
