import React from "react";

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
    <table className="min-w-full border border-gray-400 text-sm dark:border-darkSurface">
      <thead>
        <tr className="bg-gray-100 dark:bg-darkSurface">
          {columns.map((col) => (
            <th key={col.header} className="p-2 text-start border-b">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const candidate = row as Record<string, unknown>;
          const rowKey =
            getRowKey?.(row, idx) ??
            (candidate.id as string | number | undefined) ??
            (candidate.timestamp as string | number | undefined) ??
            idx;
          return (
            <tr key={rowKey} className="odd:bg-gray-50 dark:odd:bg-darkSurface">
              {columns.map((col) => (
                <td key={`${rowKey}-${col.header}`} className="p-2">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default SafeTable;
