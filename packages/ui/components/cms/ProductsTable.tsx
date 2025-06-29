// packages/ui/components/cms/ProductsTable.tsx
"use client";

import { Button } from "@/components/atoms-shadcn";
import { deleteProduct, duplicateProduct } from "@cms/actions/products";
import { ProductPublication } from "@platform-core/products";
import Link from "next/link";
import {
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import DataTable from "./DataTable";
import ProductFilters from "./ProductFilters";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Props {
  shop: string;
  rows: ProductPublication[];
  isAdmin: boolean;
}

interface Column<T> {
  header: string;
  width?: string;
  render: (row: T) => ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function ProductsTableBase({ shop, rows, isAdmin }: Props): ReactElement {
  /* ---------------------------------------------------------------------- */
  /*  Local filter state                                                    */
  /* ---------------------------------------------------------------------- */
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("all"); // active | draft | archived

  /* ---------------------------------------------------------------------- */
  /*  Memoised helpers                                                      */
  /* ---------------------------------------------------------------------- */

  /** Deduplicate every locale present in the dataset */
  const availableLocales = useMemo<string[]>(() => {
    const set = new Set<string>();
    rows.forEach((p) => Object.keys(p.title).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  /** Normalise the query so `.toLowerCase()` is always safe */
  const normalisedQuery = useMemo<string>(
    () => search?.trim().toLowerCase() ?? "",
    [search]
  );

  /** Row-level filter (search + status) */
  const filteredRows = useMemo<ProductPublication[]>(() => {
    return rows.filter((p) => {
      /* -------- title & SKU matches (safe string defaults) -------------- */
      const matchesTitle = availableLocales.some((loc) => {
        const t = (p.title as Record<string, string>)[loc] ?? "";
        return t.toLowerCase().includes(normalisedQuery);
      });

      const sku = p.sku ?? "";
      const matchesSku = sku.toLowerCase().includes(normalisedQuery);

      const matchesQuery =
        normalisedQuery.length === 0 || matchesTitle || matchesSku;

      /* ------------------------------ status ---------------------------- */
      const matchesStatus = status === "all" || p.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [rows, normalisedQuery, status, availableLocales]);

  /* ---------------------------------------------------------------------- */
  /*  Stable action handlers                                                */
  /* ---------------------------------------------------------------------- */

  const handleDuplicate = useCallback(
    (id: string) => duplicateProduct(shop, id),
    [shop]
  );

  const handleDelete = useCallback(
    (id: string) => {
      /* eslint-disable no-alert -- simple confirm dialog is fine here */
      if (confirm("Delete this product?")) deleteProduct(shop, id);
    },
    [shop]
  );

  /* ---------------------------------------------------------------------- */
  /*  Columns                                                               */
  /* ---------------------------------------------------------------------- */

  const columns = useMemo<Column<ProductPublication>[]>(() => {
    return [
      {
        header: "Title",
        render: (p) =>
          isAdmin ? (
            <Link
              href={`/cms/shop/${shop}/products/${p.id}/edit`}
              className="underline"
            >
              {p.title.en}
            </Link>
          ) : (
            <span>{p.title.en}</span>
          ),
      },
      {
        header: "SKU",
        width: "10rem",
        render: (p) => p.sku ?? "—",
      },
      {
        header: "Price",
        render: (p) => `${(p.price / 100).toFixed(2)} ${p.currency}`,
      },
      {
        header: "Status",
        render: (p) => p.status,
      },
      {
        header: "Actions",
        width: "12rem",
        render: (p) => (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cms/shop/${shop}/products/${p.id}/edit`}
              className="bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-white"
            >
              Edit
            </Link>
            <Link
              href={`/en/product/${p.id}`}
              className="rounded border px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              View
            </Link>
            <Button
              onClick={() => handleDuplicate(p.id)}
              variant="outline"
              className="px-2 py-1 text-xs"
            >
              Duplicate
            </Button>
            <Button
              onClick={() => handleDelete(p.id)}
              variant="outline"
              className="px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-900"
            >
              Delete
            </Button>
          </div>
        ),
      },
    ];
  }, [isAdmin, shop, handleDuplicate, handleDelete]);

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      <ProductFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />
      <DataTable
        rows={filteredRows}
        columns={columns}
        selectable={isAdmin}
      />{" "}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export default memo(ProductsTableBase);
