// packages/ui/hooks/__tests__/useProductFilters.test.tsx
import { useEffect } from "react";
import { describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";

import type { ProductPublication } from "@acme/types";

import { type ProductStatus,useProductFilters } from "../useProductFilters";

/* ------------------------------------------------------------------
 * Test fixtures
 * ------------------------------------------------------------------ */
// i18n-exempt: test fixtures include user-facing example titles
const products: ProductPublication[] = [
  {
    id: "1",
    sku: "red",
    title: { en: "Red Shoe", de: "Roter Schuh", it: "Scarpa rossa" }, // i18n-exempt: fixture title
    description: { en: "", de: "", it: "" },
    price: 1,
    currency: "EUR",
    media: [],
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    shop: "s",
    status: "active",
    row_version: 1,
  },
  {
    id: "2",
    sku: "blue",
    title: { en: "Blue Shoe", de: "Blauer Schuh", it: "Scarpa blu" }, // i18n-exempt: fixture title
    description: { en: "", de: "", it: "" },
    price: 1,
    currency: "EUR",
    media: [],
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    shop: "s",
    status: "draft",
    row_version: 1,
  },
  {
    id: "3",
    sku: "green",
    title: { en: "Green Shoe", de: "Gruener Schuh", it: "Scarpa verde" }, // i18n-exempt: fixture title
    description: { en: "", de: "", it: "" },
    price: 1,
    currency: "EUR",
    media: [],
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    shop: "s",
    status: "archived",
    row_version: 1,
  },
];

/* ------------------------------------------------------------------
 * Helper component for the hook
 * ------------------------------------------------------------------ */
function Wrapper({
  search,
  status,
}: {
  search: string;
  status: ProductStatus;
}) {
  const { setSearch, setStatus, filteredRows } = useProductFilters(products as any);

  useEffect(() => {
    setSearch(search);
    setStatus(status);
  }, [search, status, setSearch, setStatus]); // <- added missing deps

  return (
    <span data-cy="ids">{filteredRows.map((p) => p.id).join(",")}</span>
  );
}

/* ------------------------------------------------------------------
 * Test suite
 * ------------------------------------------------------------------ */
describe("useProductFilters", () => {
  it.each([
    ["blauer", "2"], // i18n-exempt: locale-specific search term
    ["verde", "3"], // i18n-exempt: locale-specific search term
    ["scarpa", "1,2,3"], // i18n-exempt: shared locale word
    ["blu", "2"], // i18n-exempt: partial SKU
  ])(
    "filters '%s'", // i18n-exempt: test name
    async (term, ids) => {
    render(<Wrapper search={term} status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe(ids)
    );
  }
  );

  it(
    "filters by status transitions", // i18n-exempt: test name
    async () => {
    const { rerender } = render(<Wrapper search="" status="all" />);
    expect(screen.getByTestId("ids").textContent).toBe("1,2,3");

    rerender(<Wrapper search="" status="active" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("1")
    );

    rerender(<Wrapper search="" status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("1,2,3")
    );

    rerender(<Wrapper search="" status="draft" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("2")
    );

    rerender(<Wrapper search="" status="archived" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("3")
    );
  }
  );
});
