"use client";

import React, { useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import useIngredients from "../../hooks/data/inventory/useIngredients";
import { PageShell } from "../common/PageShell";
import ReceptionSkeleton from "../common/ReceptionSkeleton";

function IngredientStock() {
  const {
    ingredients,
    loading,
    error,
    updateIngredient,
    legacyIngredients,
    migrateLegacyIngredients,
    migrationComplete,
  } = useIngredients();
  const [edits, setEdits] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <PageShell title="Ingredient Stock">
        <ReceptionSkeleton rows={3} />
      </PageShell>
    );
  }
  if (error) {
    return (
      <PageShell title="Ingredient Stock">
        <p className="text-error-main">Error loading inventory</p>
      </PageShell>
    );
  }

  const rows = Object.values(ingredients).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const handleChange = (name: string, value: string) => {
    setEdits((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (name: string) => {
    const qty = parseInt(edits[name], 10);
    if (!Number.isNaN(qty)) {
      await updateIngredient(name, qty);
    }
  };

  return (
    <PageShell title="Ingredient Stock">
      <div className="bg-surface rounded-xl shadow-lg p-6 space-y-4">
        {Object.keys(legacyIngredients).length > 0 && !migrationComplete && (
          <div className="mb-4 rounded-lg border border-warning-main bg-warning-light/20 p-3 text-sm">
            <p className="font-semibold">Legacy ingredient data detected.</p>
            <p>
              Migrate {Object.keys(legacyIngredients).length} items into the
              inventory ledger to enable audit trails.
            </p>
            <Button
              className="mt-2 px-3 py-1 rounded-lg bg-warning-main text-primary-fg hover:bg-warning-dark"
              onClick={() => {
                if (
                  window.confirm(
                    "Migrate legacy ingredients into inventory items + ledger? This will optionally remove inventory/ingredients."
                  )
                ) {
                  void migrateLegacyIngredients({ removeLegacy: true });
                }
              }}
            >
              Migrate Legacy Ingredients
            </Button>
          </div>
        )}
        {migrationComplete && (
          <div className="mb-4 rounded-lg border border-success-main bg-success-light/20 p-3 text-sm text-success-main">
            Legacy ingredients migrated successfully.
          </div>
        )}
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="p-2 text-start">Ingredient</TableHead>
              <TableHead className="p-2 text-end">Quantity</TableHead>
              <TableHead className="p-2">Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((ing) => (
              <TableRow key={ing.name}>
                <TableCell className="p-2 border-b">{ing.name}</TableCell>
                <TableCell className="p-2 border-b text-end">{ing.quantity}</TableCell>
                <TableCell className="p-2 border-b">
                  <input
                    type="number"
                    className="border p-1 w-20"
                    value={edits[ing.name] ?? ing.quantity}
                    onChange={(e) => handleChange(ing.name, e.target.value)}
                  />
                  <Button
                    className="ms-2 px-2 py-1 bg-primary-main text-primary-fg rounded-lg"
                    onClick={() => handleSave(ing.name)}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}

export default React.memo(IngredientStock);
