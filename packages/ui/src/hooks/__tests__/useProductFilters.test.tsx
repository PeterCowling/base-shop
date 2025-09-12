// packages/ui/hooks/__tests__/useProductFilters.test.tsx
import { describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";

import type { ProductPublication } from "@acme/types";
import { useProductFilters, type ProductStatus } from "../useProductFilters";

/* ------------------------------------------------------------------
 * Test fixtures
 * ------------------------------------------------------------------ */
const products: ProductPublication[] = [
  {
    id: "1",
    sku: "red",
    title: { en: "Red Shoe", de: "Roter Schuh", it: "Scarpa rossa" },
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
    title: { en: "Blue Shoe", de: "Blauer Schuh", it: "Scarpa blu" },
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
    title: { en: "Green Shoe", de: "Gruener Schuh", it: "Scarpa verde" },
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
  const { setSearch, setStatus, filteredRows } = useProductFilters(products);

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
  it("filters search text across locales", async () => {
    const { rerender } = render(<Wrapper search="" status="all" />);
    expect(screen.getByTestId("ids").textContent).toBe("1,2,3");

    rerender(<Wrapper search="blauer" status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("2")
    );

    rerender(<Wrapper search="verde" status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("3")
    );

    rerender(<Wrapper search="scarpa" status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("1,2,3")
    );

    rerender(<Wrapper search="blue" status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("2")
    );

    rerender(<Wrapper search="  blue  " status="all" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("2")
    );
  });

  it("filters by status", async () => {
    const { rerender } = render(<Wrapper search="" status="all" />);
    expect(screen.getByTestId("ids").textContent).toBe("1,2,3");

    rerender(<Wrapper search="" status="active" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("1")
    );

    rerender(<Wrapper search="" status="draft" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("2")
    );

    rerender(<Wrapper search="" status="archived" />);
    await waitFor(() =>
      expect(screen.getByTestId("ids").textContent).toBe("3")
    );
  });
});
