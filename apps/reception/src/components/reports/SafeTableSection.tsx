/* src/components/reports/SafeTableSection.tsx */
import React from "react";

import type { SafeCount } from "../../types/hooks/data/safeCountData";

import { type Column,SafeTable } from "./SafeTable";

interface SafeTableSectionProps {
  title: string;
  rows: SafeCount[];
  columns: Column<SafeCount>[];
  emptyMessage: string;
  /**
   * Extracts a unique key for each row. If omitted, `SafeTable` will attempt
   * to use an `id` or `timestamp` property and finally fall back to the row
   * index.
   */
  getRowKey?: (row: SafeCount, index: number) => string | number;
}

const SafeTableSection: React.FC<SafeTableSectionProps> = ({
  title,
  rows,
  columns,
  emptyMessage,
  getRowKey,
}) => (
  <section>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    {rows.length === 0 ? (
      <p className="italic text-sm text-gray-600 dark:text-darkAccentGreen">
        {emptyMessage}
      </p>
    ) : (
      <SafeTable columns={columns} rows={rows} getRowKey={getRowKey} />
    )}
  </section>
);

export default SafeTableSection;
