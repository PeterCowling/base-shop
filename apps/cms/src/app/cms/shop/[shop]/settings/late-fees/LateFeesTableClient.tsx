"use client";

import DataTable from "@acme/cms-ui/DataTable";

import { lateFeeColumns, type LateFeeRow } from "../tableMappers";

export default function LateFeesTableClient({ rows }: { rows: LateFeeRow[] }) {
  return (
    <div className="mt-4">
      <DataTable rows={rows} columns={lateFeeColumns} />
    </div>
  );
}

