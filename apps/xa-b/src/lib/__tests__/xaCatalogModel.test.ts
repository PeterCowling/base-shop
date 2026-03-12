import { describe, expect, it } from "@jest/globals";

import { parseXaCatalogModel } from "../xaCatalogModel";

const baseProduct = {
  handle: "test-product",
  title: "Test Product",
  brand: "test-brand",
  collection: "test-collection",
  prices: {},
  createdAt: "2024-01-01T00:00:00.000Z",
  popularity: 0,
  media: [] as unknown[],
  taxonomy: {
    department: "women" as const,
    category: "bags" as const,
    subcategory: "tote",
  },
};

const baseCatalog = {
  collections: [] as unknown[],
  brands: [] as unknown[],
  products: [] as typeof baseProduct[],
};

describe("parseXaCatalogModel", () => {
  it("TC-01: draft-only catalog produces empty products array", () => {
    const catalog = {
      ...baseCatalog,
      products: [{ ...baseProduct, status: "draft" }],
    };
    const result = parseXaCatalogModel(catalog, null);
    expect(result).not.toBeNull();
    expect(result!.products).toHaveLength(0);
  });

  it("TC-02: mixed live + draft returns only the live product", () => {
    const catalog = {
      ...baseCatalog,
      products: [
        { ...baseProduct, handle: "live-product", status: "live" },
        { ...baseProduct, handle: "draft-product", status: "draft" },
      ],
    };
    const result = parseXaCatalogModel(catalog, null);
    expect(result).not.toBeNull();
    expect(result!.products).toHaveLength(1);
    expect(result!.products[0]!.handle).toBe("live-product");
  });

  it("TC-03: out_of_stock product is included unchanged", () => {
    const catalog = {
      ...baseCatalog,
      products: [{ ...baseProduct, handle: "oos-product", status: "out_of_stock" }],
    };
    const result = parseXaCatalogModel(catalog, null);
    expect(result).not.toBeNull();
    expect(result!.products).toHaveLength(1);
    expect(result!.products[0]!.status).toBe("out_of_stock");
  });
});
