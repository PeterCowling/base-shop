import { act, renderHook } from "@testing-library/react";

import { useProductFilters } from "../useProductFilters";

type Row = {
  id: string;
  title: string | Record<string, string>;
  sku: string;
  status: "active" | "draft" | "archived";
};

const rows: Row[] = [
  { id: "1", title: "Simple Shoe", sku: "simple", status: "active" },
  {
    id: "2",
    title: { en: "Blue Shoe", de: "Blauer Schuh" },
    sku: "blue",
    status: "draft",
  },
  {
    id: "3",
    title: { en: "Green Shoe", fr: "Chaussure verte", es: "Zapato verde" },
    sku: "green",
    status: "archived",
  },
  { id: "4", title: "Black Shoe", sku: "sku-123", status: "active" },
];

describe("useProductFilters", () => {
  it("filters by title, SKU, and unmatched queries", () => {
    const { result } = renderHook(() => useProductFilters(rows));

    act(() => result.current.setSearch("simple"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["1"]);

    act(() => result.current.setSearch("blauer"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["2"]);

    act(() => result.current.setSearch("zapato"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["3"]);

    act(() => result.current.setSearch("sku-123"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["4"]);

    act(() => result.current.setSearch("green"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["3"]);

    act(() => result.current.setSearch("purple"));
    expect(result.current.filteredRows).toHaveLength(0);
  });

  it("switches status between all and specific values", () => {
    const { result } = renderHook(() => useProductFilters(rows));

    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["1", "2", "3", "4"]);

    act(() => result.current.setStatus("draft"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["2"]);

    act(() => result.current.setStatus("archived"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["3"]);

    act(() => result.current.setStatus("active"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["1", "4"]);

    act(() => result.current.setStatus("all"));
    expect(result.current.filteredRows.map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
  });
});

