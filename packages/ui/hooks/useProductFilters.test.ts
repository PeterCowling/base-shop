import { describe, it, expect } from "@jest/globals";
import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useProductFilters, type ProductStatus } from "../useProductFilters.ts";
import type { ProductPublication } from "@platform-core/products";

const products: ProductPublication[] = [
  {
    id: "1",
    sku: "red",
    title: { en: "Red Shoe", de: "Roter Schuh", it: "Scarpa rossa" },
    description: { en: "", de: "", it: "" },
    price: 1,
    currency: "EUR",
    images: [],
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
    images: [],
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
    images: [],
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    shop: "s",
    status: "archived",
    row_version: 1,
  },
];

function Wrapper({ search, status }: { search: string; status: ProductStatus }) {
  const { setSearch, setStatus, filteredRows } = useProductFilters(products);
  useEffect(() => {
    setSearch(search);
    setStatus(status);
  }, [search, status]);
  return (
    <span data-testid="ids">{filteredRows.map((p) => p.id).join(",")}</span>
  );
}

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