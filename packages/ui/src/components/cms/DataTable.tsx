"use client";

import { ReactNode, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms-shadcn/Table";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode; // ← use the canonical ReactNode type
  width?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  /** Enable checkbox row selection */
  selectable?: boolean;
  onSelectionChange?: (rows: T[]) => void;
}

export default function DataTable<T>({
  rows,
  columns,
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelected(next);
    onSelectionChange?.(Array.from(next).map((i) => rows[i]));
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
              key={i}
              data-state={selected.has(i) ? "selected" : undefined}
              onClick={selectable ? () => toggle(i) : undefined}
              className={selectable ? "cursor-pointer" : undefined}
            >
              {selectable && (
                <TableCell className="w-4">
                  <input
                    type="checkbox"
                    className="accent-primary size-4"
                    checked={selected.has(i)}
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
