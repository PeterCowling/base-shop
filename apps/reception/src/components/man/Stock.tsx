"use client";

import React, { useMemo } from "react";

import { Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";

import { useProducts } from "../../hooks/data/bar/useProducts";
import { PageShell } from "../common/PageShell";

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
    <PageShell title="STOCK">
      <div className="bg-surface rounded-xl shadow-lg p-6">
        <div className="overflow-auto">
          <Table className="min-w-full border-collapse text-sm">
            <TableHeader>
              <TableRow className="bg-surface-3">
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
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b text-end">
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  );
}

export default React.memo(Stock);
