import { describe, expect, it } from "@jest/globals";

import type { XaProduct } from "../demoData";
import { collectFacetValues, getFilterConfigs } from "../xaFilters";

const baseProduct = (overrides: Partial<XaProduct>): XaProduct => {
  const { taxonomy, ...rest } = overrides;
  return {
    id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    slug: "test-product",
    title: "Test Product",
    price: 25000,
    deposit: 0,
    stock: 4,
    forSale: true,
    forRental: false,
    media: [{ url: "https://example.com/image.jpg", type: "image" }],
    sizes: ["M"],
    description: "Sample description.",
    brand: "acme",
    collection: "spring",
    compareAtPrice: 30000,
    createdAt: "2025-01-01T00:00:00Z",
    popularity: 12,
    taxonomy: {
      department: "women",
      category: "clothing",
      subcategory: "dresses",
      color: ["red"],
      material: ["cotton"],
      ...(taxonomy ?? {}),
    },
    ...rest,
  };
};

describe("xaFilters", () => {
  it("labels type filters per category and respects showType", () => {
    const bagConfigs = getFilterConfigs("bags");
    const typeConfig = bagConfigs.find((config) => config.key === "type");
    expect(typeConfig?.label).toBe("Bag type");

    const jewelryConfigs = getFilterConfigs("jewelry");
    const jewelryType = jewelryConfigs.find((config) => config.key === "type");
    expect(jewelryType?.label).toBe("Type");

    const clothingConfigs = getFilterConfigs("clothing");
    const clothingType = clothingConfigs.find((config) => config.key === "type");
    expect(clothingType?.label).toBe("Category");

    const withoutType = getFilterConfigs("bags", { showType: false });
    expect(withoutType.some((config) => config.key === "type")).toBe(false);
  });

  it("collects and sorts size facets using the predefined size order", () => {
    const products: XaProduct[] = [
      baseProduct({
        id: "01ARZ3NDEKTSV4RRFFQ69G5FAW",
        sizes: ["M", "XS"],
        taxonomy: { subcategory: "tops" },
      }),
      baseProduct({
        id: "01ARZ3NDEKTSV4RRFFQ69G5FAX",
        sizes: ["L", "One Size"],
        taxonomy: { subcategory: "jackets" },
      }),
    ];

    const configs = getFilterConfigs("clothing");
    const facets = collectFacetValues(products, configs);

    expect(facets.size).toEqual(["XS", "M", "L", "One Size"]);
    expect(facets.type).toEqual(["jackets", "tops"]);
  });
});
