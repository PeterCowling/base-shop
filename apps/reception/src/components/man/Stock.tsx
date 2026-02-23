"use client";

import React, { useMemo } from "react";

import {
  ReceptionInput,
  ReceptionTable as Table,
  ReceptionTableBody as TableBody,
  ReceptionTableCell as TableCell,
  ReceptionTableHead as TableHead,
  ReceptionTableHeader as TableHeader,
  ReceptionTableRow as TableRow,
} from "@acme/ui/operations";

import { useProducts } from "../../hooks/data/bar/useProducts";

function Stock() {
  const { getProductsByCategory } = useProducts();

  const productNames = useMemo(() => {
    const categoryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15];
    const names = new Set<string>();
    categoryIds.forEach((id) => {
      const rows = getProductsByCategory(id);
      rows.forEach((r) => names.add(r[0]));
    });
    return Array.from(names).sort();
  }, [getProductsByCategory]);

  return (
    <div className="min-h-80vh p-4 bg-surface-2 font-sans text-foreground dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        STOCK
      </h1>
      <div className="bg-surface rounded-lg shadow p-6 dark:bg-darkSurface">
        <div className="overflow-auto">
          <Table className="min-w-full border-collapse text-sm">
            <TableHeader>
              <TableRow className="bg-surface-3 dark:bg-darkSurface">
                <TableHead className="p-2 border-b text-start">Item</TableHead>
                <TableHead className="p-2 border-b text-end">Expected</TableHead>
                <TableHead className="p-2 border-b text-end">Add Purchase</TableHead>
                <TableHead className="p-2 border-b text-end">Add Re-count</TableHead>
                <TableHead className="p-2 border-b text-end">Remove Leakage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productNames.map((name) => (
                <TableRow key={name}>
                  <TableCell className="p-2 border-b">{name}</TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <ReceptionInput type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <ReceptionInput type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <ReceptionInput type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <ReceptionInput type="number" className="w-20 border p-1" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Stock);
