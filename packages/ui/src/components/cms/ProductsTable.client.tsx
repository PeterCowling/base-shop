// packages/ui/components/cms/ProductsTable.tsx
"use client";

import { deleteProduct, duplicateProduct } from "@cms/actions/products.server";
import { ProductPublication } from "@platform-core/src/products";
import { useProductFilters } from "@ui/hooks/useProductFilters";
import Link from "next/link";
import { memo, ReactElement, ReactNode, useCallback, useMemo } from "react";
import DataTable from "./DataTable";
import { ProductFilters, ProductRowActions } from "./products";

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
  const { search, status, setSearch, setStatus, filteredRows } =
    useProductFilters(rows);

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
          <ProductRowActions
            shop={shop}
            product={p}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
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
