// packages/ui/src/components/cms/ProductsTable.client.tsx

"use client";

import { memo, type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import Link from "next/link";

import { useTranslations } from "@acme/i18n";
import { formatCurrency } from "@acme/lib/format";
import type { ProductPublication, PublicationStatus } from "@acme/types";

import { useProductFilters } from "../../hooks/useProductFilters";

import DataTable from "./DataTable";
import { ProductFilters, ProductRowActions } from "./products";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Props {
  shop: string;
  rows: ProductPublication[];
  isAdmin: boolean;
  sellability?: Record<
    string,
    { state: "sellable" | "needs_attention"; issues: string[]; stock: number }
  >;
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
  sellability,
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
    const issueLabel = (issue: string) => {
      switch (issue) {
        case "inactive":
          return String(t("products.sellability.inactive"));
        case "needs_stock":
          return String(t("products.sellability.needs_stock"));
        case "needs_media":
          return String(t("products.sellability.needs_media"));
        case "missing_translations":
          return String(t("products.sellability.missing_translations"));
        case "pending_rebuild":
          return String(t("products.sellability.pending_rebuild"));
        default:
          return issue;
      }
    };

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
        header: String(t("products.columns.sellability")),
        render: (p) => {
          const info = sellability?.[p.id];
          if (!info) return "—";
          if (info.state === "sellable") {
            return (
              <span className="inline-flex items-center rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success-foreground">
                {t("products.sellability.sellable")}
              </span>
            );
          }
          const labels = info.issues.map((i) => issueLabel(i));
          return (
            <span className="inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-foreground">
              {labels.join(" · ")}
            </span>
          );
        },
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
  }, [isAdmin, sellability, shop, handleDuplicate, handleDelete, t]);

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
