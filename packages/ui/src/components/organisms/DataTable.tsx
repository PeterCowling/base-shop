"use client";

import { ReactNode, useState } from "react";
import { toggleItem } from "@acme/shared-utils";
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
              key={i}
              data-state={selected.includes(i) ? "selected" : undefined}
              onClick={selectable ? () => toggle(i) : undefined}
              className={selectable ? "cursor-pointer" : undefined}
            >
              {selectable && (
                <TableCell className="w-4">
                  <input
                    type="checkbox"
                    className="accent-primary size-10"
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
