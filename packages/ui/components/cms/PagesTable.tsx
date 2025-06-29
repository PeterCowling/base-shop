// packages/ui/components/cms/PagesTable.tsx
"use client";

import Link from "next/link";

import type { Page } from "@types";
import DataTable from "./DataTable";

interface Props {
  shop: string;
  pages: Page[];
  canWrite?: boolean;
}

export default function PagesTable({ shop, pages, canWrite = false }: Props) {
  const columns = [
    {
      header: "Slug",
      render: (p: Page) => p.slug,
    },
    {
      header: "Status",
      width: "8rem",
      render: (p: Page) => p.status,
    },
  ];

  if (canWrite) {
    columns.push({
      header: "Actions",
      width: "6rem",
      render: (p: Page) => (
        <Link
          href={`/cms/${shop}/pages/${p.slug}/builder`}
          className="bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-white"
        >
          Edit
        </Link>
      ),
    });
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <Link
          href={`/cms/${shop}/pages/new/builder`}
          className="bg-primary hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm text-white"
        >
          New Page
        </Link>
      )}
      <DataTable rows={pages} columns={columns} />
    </div>
  );
}
