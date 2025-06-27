// packages/ui/components/cms/PagesTable.tsx
"use client";

import type { Page } from "@types";
import DataTable from "./DataTable";

interface Props {
  shop: string;
  pages: Page[];
}

export default function PagesTable({ shop, pages }: Props) {
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

  return <DataTable rows={pages} columns={columns} />;
}
