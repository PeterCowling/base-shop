import * as React from "react";
import { describe, expect, it } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

import type { XaProduct } from "../../lib/demoData";
import { CartProvider, useCart } from "../XaCartContext";

const makeProduct = (id: string, stock = 2): XaProduct => ({
  id,
  slug: id,
  title: "Product",
  price: 100,
  deposit: 0,
  stock,
  forSale: true,
  forRental: false,
  media: [{ url: "https://example.com/img.jpg", type: "image" }],
  sizes: ["S"],
  description: "desc",
  brand: "acme",
  collection: "core",
  createdAt: "2024-01-01T00:00:00Z",
  popularity: 1,
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "tops",
    color: ["black"],
    material: ["cotton"],
  },
});

describe("XaCartContext", () => {
  it("adds, updates, and removes cart lines", async () => {
    window.localStorage.clear();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CartProvider, null, children);
    const { result } = renderHook(() => useCart(), { wrapper });
    const sku = makeProduct("sku-1", 3);

    await act(async () => {
      await result.current[1]({ type: "add", sku, size: "S", qty: 2 });
    });
    expect(result.current[0]["sku-1:S"]?.qty).toBe(2);

    await act(async () => {
      await result.current[1]({ type: "setQty", id: "sku-1:S", qty: 5 });
    });
    expect(result.current[0]["sku-1:S"]?.qty).toBe(3);

    await act(async () => {
      await result.current[1]({ type: "remove", id: "sku-1:S" });
    });
    expect(result.current[0]["sku-1:S"]).toBeUndefined();
  });

  it("requires size when adding sized products", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CartProvider, null, children);
    const { result } = renderHook(() => useCart(), { wrapper });
    const sku = makeProduct("sku-2", 1);

    await expect(
      act(async () => {
        await result.current[1]({ type: "add", sku });
      }),
    ).rejects.toThrow("Size is required");
  });
});
