import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

import type { XaProduct } from "../demoData";
import { useXaListingFilters } from "../useXaListingFilters";

const pushMock = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => "/women/clothing",
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParams,
}));

const makeProduct = (overrides: Partial<XaProduct>): XaProduct => {
  const { taxonomy, ...rest } = overrides;
  return {
    id: "01ARZ3NDEKTSV4RRFFQ69G5FA0",
    slug: "product",
    title: "Product",
    price: 100,
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
      ...(taxonomy ?? {}),
    },
    ...rest,
  };
};

describe("useXaListingFilters", () => {
  it("filters for in-stock sale items", () => {
    searchParams = new URLSearchParams("availability=in-stock&sale=1");
    const products = [
      makeProduct({ id: "1", compareAtPrice: 150, stock: 2 }),
      makeProduct({ id: "2", compareAtPrice: 120, stock: 0 }),
      makeProduct({ id: "3", compareAtPrice: 100, stock: 5 }),
    ];

    const { result } = renderHook(() =>
      useXaListingFilters({
        products,
        category: "clothing",
        cart: {},
        filtersOpen: false,
      }),
    );

    expect(result.current.filteredProducts.map((p) => p.id)).toEqual(["1"]);
    expect(result.current.hasAppliedFilters).toBe(true);
  });

  it("updates the sort query param", () => {
    searchParams = new URLSearchParams();
    pushMock.mockReset();
    const { result } = renderHook(() =>
      useXaListingFilters({
        products: [makeProduct({ id: "1" })],
        category: "clothing",
        cart: {},
        filtersOpen: false,
      }),
    );

    act(() => {
      result.current.applySort("price-desc");
    });

    expect(pushMock).toHaveBeenCalledWith("/women/clothing?sort=price-desc");
  });

  it("applies draft filter values to the URL", async () => {
    searchParams = new URLSearchParams();
    pushMock.mockReset();
    const { result } = renderHook(() =>
      useXaListingFilters({
        products: [makeProduct({ id: "1" })],
        category: "clothing",
        cart: {},
        filtersOpen: true,
      }),
    );

    await act(async () => {
      result.current.toggleDraftValue("designer", "acme");
    });
    await act(async () => {
      result.current.applyFilters();
    });

    expect(pushMock).toHaveBeenCalledWith("/women/clothing?f%5Bdesigner%5D=acme");
  });

  it("applies availability, sale, and price range filters", () => {
    searchParams = new URLSearchParams();
    pushMock.mockReset();
    const { result } = renderHook(() =>
      useXaListingFilters({
        products: [makeProduct({ id: "1" })],
        category: "clothing",
        cart: {},
        filtersOpen: true,
      }),
    );

    act(() => {
      result.current.setDraftInStock(true);
      result.current.setDraftSale(true);
      result.current.setDraftNewIn(true);
      result.current.setDraftMin("10");
      result.current.setDraftMax("50");
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/women/clothing?availability=in-stock&sale=1&new-in=1&price%5Bmin%5D=10&price%5Bmax%5D=50",
    );
  });

  it("builds applied chips and removes values", () => {
    searchParams = new URLSearchParams(
      "availability=in-stock&sale=1&window=day&price[min]=10&price[max]=50&f[color]=black",
    );
    pushMock.mockReset();

    const { result } = renderHook(() =>
      useXaListingFilters({
        products: [makeProduct({ id: "1" })],
        category: "clothing",
        cart: {},
        filtersOpen: false,
      }),
    );

    const labels = result.current.appliedChips.map((chip) => chip.label);
    expect(labels).toContain("New in: Today");
    expect(labels).toContain("Price: 10-50");
    expect(labels.some((label) => label.includes("Color"))).toBe(true);

    const priceChip = result.current.appliedChips.find((chip) =>
      chip.label.startsWith("Price:"),
    );
    priceChip?.onRemove();
    expect(pushMock).toHaveBeenCalledWith(
      "/women/clothing?availability=in-stock&sale=1&window=day&f%5Bcolor%5D=black",
    );

    const colorChip = result.current.appliedChips.find((chip) =>
      chip.label.includes("Color"),
    );
    colorChip?.onRemove();
    expect(pushMock).toHaveBeenCalledWith(
      "/women/clothing?availability=in-stock&sale=1&window=day&price%5Bmin%5D=10&price%5Bmax%5D=50",
    );
  });
});
