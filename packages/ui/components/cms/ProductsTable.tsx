// packages/ui/components/cms/ProductsTable.tsx
"use client";

import { ProductPublication } from "@platform-core/products";
import Link from "next/link";
import DataTable from "./DataTable"; // existing component

interface Props {
  rows: ProductPublication[];
  isAdmin: boolean;
}

export default function ProductsTable({ rows, isAdmin }: Props) {
  return (
    <DataTable
      rows={rows}
      columns={[
        {
          header: "Title",
          render: (p) =>
            isAdmin ? (
              <Link href={`/products/${p.id}/edit`} className="underline">
                {p.title.en}
              </Link>
            ) : (
              <span>{p.title.en}</span>
            ),
        },
        { header: "SKU", render: (p) => p.sku, width: "10rem" },
        {
          header: "Price",
          render: (p) => `${(p.price / 100).toFixed(2)} ${p.currency}`,
        },
        { header: "Status", render: (p) => p.status },
      ]}
    />
  );
}
