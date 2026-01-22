import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";

import type { XaProduct } from "../../demoData";
import { useXaProductSearch } from "../useXaProductSearch";

const searchProductsMock = jest.fn();

jest.mock("../xaSearchService", () => ({
  getXaSearchService: () => Promise.resolve({ searchProducts: searchProductsMock }),
}));

const product: XaProduct = {
  id: "sku-1",
  slug: "sku-1",
  title: "Test Product",
  price: 120,
  deposit: 0,
  stock: 3,
  forSale: true,
  forRental: false,
  media: [{ url: "https://example.com/img.jpg", type: "image" }],
  sizes: ["M"],
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
};

beforeEach(() => {
  searchProductsMock.mockReset();
});

describe("useXaProductSearch", () => {
  it("returns products when search resolves", async () => {
    searchProductsMock.mockResolvedValueOnce([product]);
    const { result } = renderHook(() => useXaProductSearch("bag"));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.products).toEqual([product]);
  });

  it("returns error state when search rejects", async () => {
    searchProductsMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useXaProductSearch("bag"));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.products).toEqual([]);
  });
});
