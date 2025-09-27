// packages/ui/src/components/cms/ProductsTable.client.tsx

"use client";

import type { ProductPublication, PublicationStatus } from "@acme/types";
import { useProductFilters } from "../../hooks/useProductFilters";
import { formatCurrency } from "@acme/shared-utils";
import Link from "next/link";
import { memo, ReactElement, ReactNode, useCallback, useMemo } from "react";
import DataTable from "./DataTable";
import { ProductFilters, ProductRowActions } from "./products";
import { useTranslations } from "@acme/i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Props {
  shop: string;
  rows: ProductPublication[];
  isAdmin: boolean;
  /**
   * Callback that duplicates a product on the server.
   * Provided by the host application (e.g. `apps/cms`).
   */
  onDuplicate: (shop: string, productId: string) => void | Promise<void>;
  /**
   * Callback that deletes a product on the server.
   * Provided by the host application (e.g. `apps/cms`).
   */
  onDelete: (shop: string, productId: string) => void | Promise<void>;
}

interface Column<T> {
  header: string;
  width?: string;
  render: (row: T) => ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

function ProductsTableBase({
  shop,
  rows,
  isAdmin,
  onDuplicate,
  onDelete,
}: Props): ReactElement {
  const t = useTranslations();
  /* ---------------------------------------------------------------------- */
  /*  Filters                                                               */
  /* ---------------------------------------------------------------------- */
  const { search, status, setSearch, setStatus, filteredRows } =
    useProductFilters<ProductPublication, PublicationStatus>(rows);

  /* ---------------------------------------------------------------------- */
  /*  Stable action handlers                                                */
  /* ---------------------------------------------------------------------- */
  const handleDuplicate = useCallback(
    (id: string) => onDuplicate(shop, id),
    [onDuplicate, shop]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(String(t("products.confirmDelete")))) onDelete(shop, id);
    },
    [onDelete, shop, t]
  );

  /* ---------------------------------------------------------------------- */
  /*  Columns                                                               */
  /* ---------------------------------------------------------------------- */
  const columns = useMemo<Column<ProductPublication>[]>(() => {
    return [
      {
        header: String(t("products.columns.title")),
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
        header: String(t("products.columns.sku")),
        width: "10rem",
        render: (p) => p.sku ?? "—",
      },
      {
        header: String(t("products.columns.price")),
        render: (p) => formatCurrency(p.price, p.currency),
      },
      {
        header: String(t("products.columns.status")),
        render: (p) => p.status,
      },
      {
        header: String(t("products.columns.actions")),
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
  }, [isAdmin, shop, handleDuplicate, handleDelete, t]);

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
      <DataTable rows={filteredRows} columns={columns} selectable={isAdmin} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export default memo(ProductsTableBase);
