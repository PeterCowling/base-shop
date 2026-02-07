import { describe, expect, it } from "@jest/globals";

import type { XaProduct } from "../demoData";
import {
  filterByCategory,
  filterByDepartment,
  filterBySubcategory,
  formatLabel,
  getCategoryHref,
  getDesignerName,
  getTrendingDesigners,
  isCategoryAllowed,
  isDepartmentAllowed,
} from "../xaCatalog";

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

describe("xaCatalog", () => {
  it("formats labels and category hrefs", () => {
    expect(formatLabel("belt-bag")).toBe("Belt Bag");
    expect(getCategoryHref("clothing", "men")).toBe("/men/clothing");
    expect(getCategoryHref("bags", "women")).toBe("/bags");
  });

  it("checks allowed categories and departments from config", () => {
    expect(isCategoryAllowed("clothing")).toBe(true);
    expect(isCategoryAllowed("bags")).toBe(false);
    expect(isDepartmentAllowed("women")).toBe(true);
  });

  it("filters products by taxonomy", () => {
    const products = [
      makeProduct({ id: "1", taxonomy: { category: "clothing", subcategory: "tops" } }),
      makeProduct({
        id: "2",
        taxonomy: { category: "bags", subcategory: "tote", department: "men" },
      }),
    ];

    expect(filterByCategory(products, "bags").map((p) => p.id)).toEqual(["2"]);
    expect(filterByDepartment(products, "women").map((p) => p.id)).toEqual(["1"]);
    expect(filterBySubcategory(products, "tops").map((p) => p.id)).toEqual(["1"]);
  });

  it("resolves designer names with fallback", () => {
    expect(getDesignerName("unknown-designer")).toBe("Unknown Designer");
  });

  it("returns a limited list of trending designers", () => {
    const designers = getTrendingDesigners(2);
    expect(designers.length).toBeLessThanOrEqual(2);
    for (const designer of designers) {
      expect(designer.handle).toBeTruthy();
      expect(designer.name).toBeTruthy();
    }
  });
});
