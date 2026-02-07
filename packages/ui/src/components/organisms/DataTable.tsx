"use client"; // i18n-exempt -- PB-000 [ttl=2025-12-31]: Next.js directive string

import { type ReactNode, useState } from "react";

import { toggleItem } from "@acme/lib/array";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms/primitives/table";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  selectable?: boolean;
  onSelectionChange?: (rows: T[]) => void;
}

export function DataTable<T>({
  rows,
  columns,
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  // Prefer stable keys from row.id/key; fall back to identity-based map
  const keyMap = new WeakMap<object, string>();
  let auto = 0;
  const getRowKey = (row: T): string | number => {
    const anyRow = row as unknown as Record<string, unknown>;
    const known = (anyRow && (anyRow["id"] as string | number | undefined)) ??
      (anyRow && (anyRow["key"] as string | number | undefined));
    if (known !== undefined) return known;
    if (anyRow && typeof anyRow === "object") {
      const existing = keyMap.get(anyRow as object);
      if (existing) return existing;
      const k = `row-${auto++}`;
      keyMap.set(anyRow as object, k);
      return k;
    }
    // Last resort (should be rare): stringified value
    return String(row);
  };
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (idx: number) => {
    const next = toggleItem(selected, idx);
    setSelected(next);
    onSelectionChange?.(next.map((i: number) => rows[i]));
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-4" />}
            {columns.map((col) => (
              <TableHead key={col.header} style={{ width: col.width }}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={getRowKey(row)}
              data-state={selected.includes(i) ? "selected" : undefined}
              onClick={selectable ? () => toggle(i) : undefined}
              className={selectable ? "cursor-pointer" : undefined}
            >
              {selectable && (
                <TableCell className="w-4">
                  <input
                    type="checkbox" /* i18n-exempt -- PB-000 [ttl=2025-12-31]: input type enum value */
                    className="accent-primary size-11"
                    checked={selected.includes(i)}
                    onChange={() => toggle(i)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell key={col.header}>{col.render(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
