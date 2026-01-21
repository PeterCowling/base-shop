import { act,renderHook } from "@testing-library/react";

import { useProductFilters } from "../src/hooks/useProductFilters";

type Row = { title: string | Record<string, string>; sku?: string; status?: "active" | "draft" };

const rows: Row[] = [
  { title: "Camera", sku: "C-001", status: "active" },
  { title: { en: "Tripod", fr: "Trépied" }, sku: "T-100", status: "draft" },
  { title: { en: "Bag" }, sku: "BAG-9" },
];

describe("useProductFilters", () => {
  it("filters by search over string and multilingual titles and SKU", () => {
    const { result, rerender } = renderHook(({ data }) => useProductFilters<Row, "active" | "draft">(data), {
      initialProps: { data: rows },
    });

    // Empty search shows all
    expect(result.current.filteredRows).toHaveLength(3);

    act(() => result.current.setSearch("trip"));
    rerender({ data: rows });
    expect(result.current.filteredRows.map((r) => (typeof r.title === "string" ? r.title : r.title.en))).toContain("Tripod");

    act(() => result.current.setSearch("BAG"));
    rerender({ data: rows });
    expect(result.current.filteredRows).toHaveLength(1);

    act(() => result.current.setSearch("c-00"));
    rerender({ data: rows });
    expect(result.current.filteredRows).toHaveLength(1); // matches SKU
  });

  it("applies status filter in addition to search", () => {
    const { result, rerender } = renderHook(() => useProductFilters<Row, "active" | "draft">(rows));
    act(() => result.current.setStatus("draft"));
    rerender();
    expect(result.current.filteredRows.every((r) => r.status === "draft")).toBe(true);

    act(() => result.current.setStatus("all"));
    rerender();
    expect(result.current.filteredRows).toHaveLength(3);
  });
});

