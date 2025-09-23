"use client";

import DataTable, { type Column } from "@ui/components/cms/DataTable";

interface ComponentChange {
  name: string;
  from: string | null;
  to: string;
  changelog?: string;
}

const componentColumns: Column<ComponentChange>[] = [
  { header: "Package", render: (row) => row.name },
  { header: "Current", render: (row) => row.from ?? "-" },
  { header: "New", render: (row) => row.to },
  {
    header: "Changelog",
    width: "120px",
    render: (row) =>
      row.changelog ? (
        <a
          href={row.changelog}
          target="_blank"
          rel="noreferrer"
          className="text-link underline"
        >
          View
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

export default function UpgradeSummaryClient({
  components,
}: {
  components: ComponentChange[];
}) {
  return <DataTable rows={components} columns={componentColumns} />;
}

