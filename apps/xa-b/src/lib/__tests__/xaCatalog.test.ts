import { describe, expect, it } from "@jest/globals";

import { XA_PRODUCTS } from "../demoData";
import {
  filterByCategory,
  filterByDepartment,
  filterBySubcategory,
  formatLabel,
  getCategoryHref,
  getDepartmentCategoryHref,
  getDepartmentCategorySubcategoryHref,
  getTrendingDesigners,
  isCategoryAllowed,
  isDepartmentAllowed,
  XA_SUBCATEGORIES,
} from "../xaCatalog";

describe("xaCatalog", () => {
  it("formats slug labels and resolves category hrefs", () => {
    const bagSubcategory = XA_SUBCATEGORIES.bags[0]!;
    expect(formatLabel("cross_body-bag")).toBe("Cross Body Bag");
    expect(getCategoryHref("clothing", "women")).toBe("/women/clothing");
    expect(getCategoryHref("bags")).toBe("/bags");
    expect(getDepartmentCategoryHref("women", "bags")).toBe("/women/bags");
    expect(getDepartmentCategorySubcategoryHref("women", "bags", bagSubcategory)).toBe(
      `/women/bags/${bagSubcategory}`,
    );
    expect(getDepartmentCategorySubcategoryHref("women", "bags", "unknown")).toBeNull();
  });

  it("checks configured category/department allow-lists", () => {
    expect(isCategoryAllowed("bags")).toBe(true);
    expect(isDepartmentAllowed("women")).toBe(true);
    expect(isDepartmentAllowed("kids")).toBe(true);
    expect(isCategoryAllowed("clothing")).toBe(false);
    expect(isCategoryAllowed("invalid" as any)).toBe(false);
    expect(isDepartmentAllowed("invalid" as any)).toBe(false);
  });

  it("returns ranked trending designers with optional department scoping", () => {
    const global = getTrendingDesigners(3);
    const women = getTrendingDesigners(2, "women");

    expect(global.length).toBeGreaterThan(0);
    expect(global.length).toBeLessThanOrEqual(3);
    expect(women.length).toBeGreaterThan(0);
    expect(women.length).toBeLessThanOrEqual(2);
    expect(global[0]).toEqual(
      expect.objectContaining({ handle: expect.any(String), name: expect.any(String) }),
    );
  });

  it("filters products by department/category/subcategory", () => {
    const women = filterByDepartment(XA_PRODUCTS, "women");
    expect(women.every((product) => product.taxonomy.department === "women")).toBe(true);

    const bags = filterByCategory(XA_PRODUCTS, "bags");
    expect(bags.every((product) => product.taxonomy.category === "bags")).toBe(true);

    const knownBagSubcategory = bags[0]?.taxonomy.subcategory;
    expect(typeof knownBagSubcategory).toBe("string");

    const filteredBags = filterBySubcategory(bags, knownBagSubcategory);
    expect(
      filteredBags.every((product) => product.taxonomy.subcategory === knownBagSubcategory),
    ).toBe(true);
  });
});
