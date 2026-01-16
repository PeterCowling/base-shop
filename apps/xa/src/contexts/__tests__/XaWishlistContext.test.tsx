import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";

import { useWishlist, WishlistProvider } from "../XaWishlistContext";
import type { XaProduct } from "../../lib/demoData";

const makeProduct = (id: string): XaProduct => ({
  id,
  slug: id,
  title: "Product",
  price: 100,
  deposit: 0,
  stock: 5,
  forSale: true,
  forRental: false,
  media: [{ url: "https://example.com/img.jpg", type: "image" }],
  sizes: [],
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

describe("XaWishlistContext", () => {
  it("manages wishlist items", () => {
    window.localStorage.clear();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(WishlistProvider, null, children);
    const { result } = renderHook(() => useWishlist(), { wrapper });

    act(() => {
      result.current[1]({ type: "add", sku: makeProduct("sku-1") });
    });
    expect(result.current[0]).toEqual(["sku-1"]);

    act(() => {
      result.current[1]({ type: "toggle", sku: makeProduct("sku-1") });
    });
    expect(result.current[0]).toEqual([]);
  });

  it("throws when used outside provider", () => {
    const { result } = renderHook(() => {
      try {
        return useWishlist();
      } catch (error) {
        return error as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
