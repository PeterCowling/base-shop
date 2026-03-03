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
      <div className="bg-surface rounded-lg shadow-lg p-6">
        <div className="overflow-auto">
          <Table className="min-w-full border-collapse text-sm">
            <TableHeader className="bg-surface-2">
              <TableRow>
                <TableHead className="p-2 border-b border-border-2 text-start text-muted-foreground">Item</TableHead>
                <TableHead className="p-2 border-b border-border-2 text-end text-muted-foreground">Expected</TableHead>
                <TableHead className="p-2 border-b border-border-2 text-end text-muted-foreground">Add Purchase</TableHead>
                <TableHead className="p-2 border-b border-border-2 text-end text-muted-foreground">Add Re-count</TableHead>
                <TableHead className="p-2 border-b border-border-2 text-end text-muted-foreground">Remove Leakage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productNames.map((name) => (
                <TableRow key={name} className="hover:bg-surface-2">
                  <TableCell className="p-2 border-b border-border-2">{name}</TableCell>
                  <TableCell className="p-2 border-b border-border-2 text-end">
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b border-border-2 text-end">
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b border-border-2 text-end">
                    <Input compatibilityMode="no-wrapper" type="number" className="w-20 border p-1" />
                  </TableCell>
                  <TableCell className="p-2 border-b border-border-2 text-end">
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
