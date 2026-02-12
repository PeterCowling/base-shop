"use client";

import React, { useMemo } from "react";

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
    <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        STOCK
      </h1>
      <div className="bg-white rounded-lg shadow p-6 dark:bg-darkSurface">
        <div className="overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 dark:bg-darkSurface">
                <th className="p-2 border-b text-start">Item</th>
                <th className="p-2 border-b text-end">Expected</th>
                <th className="p-2 border-b text-end">Add Purchase</th>
                <th className="p-2 border-b text-end">Add Re-count</th>
                <th className="p-2 border-b text-end">Remove Leakage</th>
              </tr>
            </thead>
            <tbody>
              {productNames.map((name) => (
                <tr key={name}>
                  <td className="p-2 border-b">{name}</td>
                  <td className="p-2 border-b text-end">
                    <input type="number" className="w-20 border p-1" />
                  </td>
                  <td className="p-2 border-b text-end">
                    <input type="number" className="w-20 border p-1" />
                  </td>
                  <td className="p-2 border-b text-end">
                    <input type="number" className="w-20 border p-1" />
                  </td>
                  <td className="p-2 border-b text-end">
                    <input type="number" className="w-20 border p-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Stock);
