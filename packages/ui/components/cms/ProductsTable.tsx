// packages/ui/components/cms/ProductsTable.tsx
"use client";

import { deleteProduct, duplicateProduct } from "@cms/actions/products";
import { ProductPublication } from "@platform-core/products";
import Link from "next/link";
import { useMemo, useState } from "react";

import DataTable from "./DataTable";
import ProductFilters from "./ProductFilters";

interface Props {
  shop: string;
  rows: ProductPublication[];
  isAdmin: boolean;
}

export default function ProductsTable({ shop, rows, isAdmin }: Props) {
  /* ------------------------------------------------------------------ */
  /*  Local filter state                                                */
  /* ------------------------------------------------------------------ */
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // active | draft | archived

  /* ------------------------------------------------------------------ */
  /*  Filter rows                                                       */
  /* ------------------------------------------------------------------ */

  const availableLocales = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((p) => {
      Object.keys(p.title).forEach((k) => set.add(k));
    });
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      const titleMatches = availableLocales.some((loc) => {
        const t = (p.title as Record<string, string>)[loc];
        return t ? t.toLowerCase().includes(q) : false;
      });
      const skuMatches = p.sku.toLowerCase().includes(q);
      const matchesQ = !q || titleMatches || skuMatches;
      const matchesStatus = status === "all" || p.status === status;
      return matchesQ && matchesStatus;
    });
  }, [rows, search, status, availableLocales]);

  /* ------------------------------------------------------------------ */
  /*  Columns                                                           */
  /* ------------------------------------------------------------------ */
  const columns = [
    {
      header: "Title",
      render: (p: ProductPublication) =>
        isAdmin ? (
          <Link
            href={`/shop/${shop}/products/${p.id}/edit`}
            className="underline"
          >
            {p.title.en}
          </Link>
        ) : (
          <span>{p.title.en}</span>
        ),
    },
    { header: "SKU", width: "10rem", render: (p: ProductPublication) => p.sku },
    {
      header: "Price",
      render: (p: ProductPublication) =>
        `${(p.price / 100).toFixed(2)} ${p.currency}`,
    },
    { header: "Status", render: (p: ProductPublication) => p.status },
    {
      header: "Actions",
      width: "12rem",
      render: (p: ProductPublication) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/shop/${shop}/products/${p.id}/edit`}
            className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90"
          >
            Edit
          </Link>
          <Link
            href={`/en/product/${p.id}`}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            View
          </Link>
          <button
            onClick={() => duplicateProduct(shop, p.id)}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Duplicate
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this product?")) deleteProduct(shop, p.id);
            }}
            className="rounded border px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-900"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-4">
      <ProductFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />
      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}
