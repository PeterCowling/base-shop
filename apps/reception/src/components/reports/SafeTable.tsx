import React from "react";

import {
  ReceptionTable as Table,
  ReceptionTableBody as TableBody,
  ReceptionTableCell as TableCell,
  ReceptionTableHead as TableHead,
  ReceptionTableHeader as TableHeader,
  ReceptionTableRow as TableRow,
} from "@acme/ui/operations";

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

export interface SafeTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /**
   * Optional callback to extract a unique React key for each row. If not
   * provided, the table will attempt to use an `id` property, then a
   * `timestamp` property, and finally fall back to the array index.
   */
  getRowKey?: (row: T, index: number) => string | number;
}

export function SafeTable<T>({
  columns,
  rows,
  getRowKey,
}: SafeTableProps<T>): JSX.Element {
  return (
    <Table className="min-w-full border border-border-2 text-sm dark:border-darkSurface">
      <TableHeader>
        <TableRow className="bg-surface-2 dark:bg-darkSurface">
          {columns.map((col) => (
            <TableHead key={col.header} className="p-2 text-start border-b">
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => {
          const candidate = row as Record<string, unknown>;
          const rowKey =
            getRowKey?.(row, idx) ??
            (candidate.id as string | number | undefined) ??
            (candidate.timestamp as string | number | undefined) ??
            idx;
          return (
            <TableRow key={rowKey} className="odd:bg-surface-2 dark:odd:bg-darkSurface">
              {columns.map((col) => (
                <TableCell key={`${rowKey}-${col.header}`} className="p-2">
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default SafeTable;
