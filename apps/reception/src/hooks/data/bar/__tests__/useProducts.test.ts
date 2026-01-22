import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { useProducts } from "../useProducts";

describe("useProducts", () => {
  it("provides category mappings and products", () => {
    const { result, rerender } = renderHook(() => useProducts());

    const {
      getProductCategory2,
      getCategoryTypeByProductName,
      getProductsByCategory,
    } = result.current;

    // Assert category type by product name
    expect(getCategoryTypeByProductName("Nutella")).toBe("Sweet");
    expect(getCategoryTypeByProductName("Americano")).toBe("Coffee");

    // Assert products returned for selected categories
    expect(getProductsByCategory(1)).toEqual(
      expect.arrayContaining([
        ["PC Reg Syrup", "ksweet", 12.5, "bg-pinkShades-row1"],
      ])
    );
    expect(getProductsByCategory(3)).toEqual(
      expect.arrayContaining([
        ["Americano", "coffee", 3.0, "bg-coffeeShades-row1"],
      ])
    );

    // Verify memoisation: references stable across renders
    const firstCategoryFn = getCategoryTypeByProductName;
    const firstProductsFn = getProductsByCategory;
    const firstProdCategory2Fn = getProductCategory2;

    rerender();

    expect(result.current.getCategoryTypeByProductName).toBe(firstCategoryFn);
    expect(result.current.getProductsByCategory).toBe(firstProductsFn);
    expect(result.current.getProductCategory2).toBe(firstProdCategory2Fn);
  });
});

