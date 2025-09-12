import { renderHook, act } from "@testing-library/react";

import { useProductFilters, type ProductStatus } from "./useProductFilters";

type Product = {
  id: string;
  title: string | Record<string, string>;
  sku?: string;
  status?: ProductStatus;
};

const rows: Product[] = [
  { id: "1", title: { en: "Red Shoe" }, sku: "red", status: "active" },
  { id: "2", title: { en: "Blue Shoe" }, sku: "blue", status: "draft" },
  { id: "3", title: { en: "Green Shoe" }, sku: "green", status: "archived" },
];

describe("useProductFilters", () => {
  it("returns default filter state", () => {
    const { result } = renderHook(() => useProductFilters(rows));

    expect(result.current.search).toBe("");
    expect(result.current.status).toBe("all");
    expect(result.current.filteredRows.map((r) => r.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("adds and removes filters", () => {
    const { result } = renderHook(() => useProductFilters(rows));

    act(() => {
      result.current.setSearch("blue");
      result.current.setStatus("draft");
    });
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["2"]);

    act(() => {
      result.current.setSearch("");
      result.current.setStatus("all");
    });
    expect(result.current.filteredRows.map((r) => r.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("generates query params from state", () => {
    const { result } = renderHook(() => useProductFilters(rows));

    act(() => {
      result.current.setSearch("red");
      result.current.setStatus("active");
    });

    const params = new URLSearchParams();
    if (result.current.search) params.set("search", result.current.search);
    if (result.current.status !== "all")
      params.set("status", result.current.status);
    expect(params.toString()).toBe("search=red&status=active");

    act(() => {
      result.current.setSearch("");
      result.current.setStatus("all");
    });
    const cleared = new URLSearchParams();
    if (result.current.search) cleared.set("search", result.current.search);
    if (result.current.status !== "all")
      cleared.set("status", result.current.status);
    expect(cleared.toString()).toBe("");
  });
});

