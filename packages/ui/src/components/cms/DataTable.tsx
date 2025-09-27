"use client";

import { ReactNode, useState } from "react";
import { toggleItem } from "@acme/shared-utils";
import { cn } from "../../utils/style";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../atoms/shadcn/Table";

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
  rowClassName?: (row: T, index: number) => string | undefined;
}

export default function DataTable<T>({
  rows,
  columns,
  selectable = false,
  onSelectionChange,
  rowClassName,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (idx: number) => {
    const next = toggleItem(selected, idx);
    setSelected(next);
    onSelectionChange?.(next.map((i) => rows[i]));
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full w-full">
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-10" />}
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
              className={cn(
                selectable ? "cursor-pointer" : undefined,
                rowClassName?.(row, i),
              )}
            >
              {selectable && (
                <TableCell className="w-10">
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
