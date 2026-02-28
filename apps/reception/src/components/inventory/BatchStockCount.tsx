import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { STOCK_ADJUSTMENT_REAUTH_THRESHOLD } from "../../constants/stock";
import { useAuth } from "../../context/AuthContext";
import useInventoryItems from "../../hooks/data/inventory/useInventoryItems";
import useInventoryLedger from "../../hooks/data/inventory/useInventoryLedger";
import { useInventoryLedgerMutations } from "../../hooks/mutations/useInventoryLedgerMutations";
import useBatchCountProgress from "../../hooks/utilities/useBatchCountProgress";
import { canAccess, Permissions } from "../../lib/roles";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { InventoryItem } from "../../types/hooks/data/inventoryItemData";
import { buildInventorySnapshot } from "../../utils/inventoryLedger";
import PasswordReauthModal from "../common/PasswordReauthModal";

const UNCATEGORIZED_LABEL = "Uncategorized";
const BATCH_REASON = "conteggio batch";

interface BatchStockCountProps {
  onComplete: () => void;
}

interface CategoryVarianceRow {
  itemId: string;
  name: string;
  expected: number;
  counted: number;
  delta: number;
}

interface PendingBatchSubmission {
  category: string;
  categoryItems: InventoryItem[];
}

export function groupItemsByCategory(
  items: InventoryItem[]
): Record<string, InventoryItem[]> {
  return items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const normalizedCategory = item.category?.trim();
    const category = normalizedCategory ? normalizedCategory : UNCATEGORIZED_LABEL;

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(item);
    return acc;
  }, {});
}

export function requiresReauth(deltas: number[], threshold: number): boolean {
  return deltas.some((delta) => Math.abs(delta) >= threshold);
}

function formatDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }

  return String(delta);
}

export default function BatchStockCount({ onComplete }: BatchStockCountProps) {
  const { user } = useAuth();
  const canManageStock = canAccess(user, Permissions.STOCK_ACCESS);

  const { items, itemsById, loading: itemsLoading, error: itemsError } = useInventoryItems();
  const { entries, loading: ledgerLoading, error: ledgerError } = useInventoryLedger();
  const { addLedgerEntry } = useInventoryLedgerMutations();

  const sessionDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const userId = user?.uid ?? user?.user_name ?? "";
  const { progress, saveProgress, clearProgress } = useBatchCountProgress(userId, sessionDate);

  const [enteredQuantities, setEnteredQuantities] = useState<Record<string, number>>({});
  const [categoriesComplete, setCategoriesComplete] = useState<string[]>([]);
  const [varianceByCategory, setVarianceByCategory] = useState<
    Record<string, CategoryVarianceRow[]>
  >({});
  const [pendingBatch, setPendingBatch] = useState<PendingBatchSubmission | null>(null);
  const [submittingCategory, setSubmittingCategory] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const enteredQuantitiesRef = useRef<Record<string, number>>({});
  const categoriesCompleteRef = useRef<string[]>([]);

  const database = useFirebaseDatabase();

  const snapshot = useMemo(
    () => buildInventorySnapshot(itemsById, entries),
    [itemsById, entries]
  );

  const itemsByCategory = useMemo(() => groupItemsByCategory(items), [items]);

  const categoryNames = useMemo(
    () => Object.keys(itemsByCategory).sort((a, b) => a.localeCompare(b, "it")),
    [itemsByCategory]
  );

  const completeCategorySet = useMemo(
    () =>
      new Set(
        categoriesComplete.filter((category) => categoryNames.includes(category))
      ),
    [categoriesComplete, categoryNames]
  );

  useEffect(() => {
    const connectedRef = ref(database, ".info/connected");

    const unsubscribe = onValue(
      connectedRef,
      (snapshotValue) => {
        setIsOnline(snapshotValue.val() === true);
      },
      () => {
        setIsOnline(false);
      }
    );

    return unsubscribe;
  }, [database]);

  useEffect(() => {
    if (!progress) {
      return;
    }

    enteredQuantitiesRef.current = progress.enteredQuantities;
    categoriesCompleteRef.current = progress.categoriesComplete;
    setEnteredQuantities(progress.enteredQuantities);
    setCategoriesComplete(progress.categoriesComplete);
  }, [progress]);

  useEffect(() => {
    enteredQuantitiesRef.current = enteredQuantities;
  }, [enteredQuantities]);

  useEffect(() => {
    categoriesCompleteRef.current = categoriesComplete;
  }, [categoriesComplete]);

  const saveBatchProgress = useCallback(
    (nextCategoriesComplete: string[], nextEnteredQuantities: Record<string, number>) => {
      saveProgress({
        categoriesComplete: nextCategoriesComplete,
        enteredQuantities: nextEnteredQuantities,
      });
    },
    [saveProgress]
  );

  const handleQuantityChange = useCallback(
    (itemId: string, value: string) => {
      const nextEnteredQuantities = { ...enteredQuantitiesRef.current };

      if (value.trim() === "") {
        delete nextEnteredQuantities[itemId];
      } else {
        const parsedValue = Number(value);

        if (!Number.isFinite(parsedValue)) {
          return;
        }

        nextEnteredQuantities[itemId] = parsedValue;
      }

      enteredQuantitiesRef.current = nextEnteredQuantities;
      setEnteredQuantities(nextEnteredQuantities);

      saveBatchProgress(categoriesCompleteRef.current, nextEnteredQuantities);
    },
    [saveBatchProgress]
  );

  const executeCategorySubmit = useCallback(
    async (category: string, categoryItems: InventoryItem[]) => {
      const varianceRows: CategoryVarianceRow[] = [];

      setSubmittingCategory(category);

      try {
        for (const item of categoryItems) {
          const itemId = item.id;

          if (!itemId) {
            continue;
          }

          const countedQuantity = enteredQuantitiesRef.current[itemId];

          if (typeof countedQuantity !== "number") {
            continue;
          }

          const expectedOnHand = snapshot[itemId]?.onHand ?? item.openingCount;
          const delta = countedQuantity - expectedOnHand;

          await addLedgerEntry({
            itemId,
            type: "count",
            quantity: delta,
            reason: BATCH_REASON,
            unit: item.unit,
          });

          varianceRows.push({
            itemId,
            name: item.name,
            expected: expectedOnHand,
            counted: countedQuantity,
            delta,
          });
        }

        setVarianceByCategory((prev) => ({
          ...prev,
          [category]: varianceRows,
        }));

        if (!categoriesCompleteRef.current.includes(category)) {
          const nextCategoriesComplete = [...categoriesCompleteRef.current, category];
          categoriesCompleteRef.current = nextCategoriesComplete;
          setCategoriesComplete(nextCategoriesComplete);

          if (nextCategoriesComplete.length === categoryNames.length) {
            clearProgress();
            onComplete();
          } else {
            saveBatchProgress(nextCategoriesComplete, enteredQuantitiesRef.current);
          }
        }
      } finally {
        setSubmittingCategory(null);
      }
    },
    [
      addLedgerEntry,
      categoryNames.length,
      clearProgress,
      onComplete,
      saveBatchProgress,
      snapshot,
    ]
  );

  const handleCompleteCategory = useCallback(
    async (category: string) => {
      if (submittingCategory) {
        return;
      }

      const categoryItems = itemsByCategory[category] ?? [];
      const deltas: number[] = [];

      for (const item of categoryItems) {
        const itemId = item.id;

        if (!itemId) {
          continue;
        }

        const countedQuantity = enteredQuantitiesRef.current[itemId];

        if (typeof countedQuantity !== "number") {
          continue;
        }

        const expectedOnHand = snapshot[itemId]?.onHand ?? item.openingCount;
        deltas.push(countedQuantity - expectedOnHand);
      }

      if (requiresReauth(deltas, STOCK_ADJUSTMENT_REAUTH_THRESHOLD)) {
        setPendingBatch({ category, categoryItems });
        return;
      }

      await executeCategorySubmit(category, categoryItems);
    },
    [executeCategorySubmit, itemsByCategory, snapshot, submittingCategory]
  );

  if (!canManageStock) {
    return null;
  }

  if (itemsLoading || ledgerLoading) {
    return (
      <div className="p-4">
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (itemsError || ledgerError) {
    return (
      <div className="p-4">
        <p className="text-error-main">Error loading inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <div className="rounded-lg border border-warning-main bg-warning-light/20 px-3 py-2 text-sm text-warning-dark">
          Sync pending...
        </div>
      )}

      <p className="text-sm font-medium">
        {completeCategorySet.size} / {categoryNames.length} categories complete
      </p>

      {categoryNames.map((category) => {
        const categoryItems = itemsByCategory[category] ?? [];
        const isCategoryComplete = completeCategorySet.has(category);
        const varianceRows = varianceByCategory[category] ?? [];

        return (
          <section key={category} className="rounded-lg border border-border-2 bg-surface p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">{category}</h3>
              <Button
                className="w-full sm:w-auto"
                disabled={isCategoryComplete || submittingCategory === category}
                onClick={() => {
                  void handleCompleteCategory(category);
                }}
              >
                Complete category
              </Button>
            </div>

            <Table className="min-w-full text-sm">
              <TableHeader className="bg-surface-2">
                <TableRow>
                  <TableHead className="p-2 text-start">Item</TableHead>
                  <TableHead className="p-2 text-start">Unit</TableHead>
                  <TableHead className="p-2 text-end">Expected</TableHead>
                  <TableHead className="p-2 text-end">Counted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryItems.map((item) => {
                  const itemId = item.id;
                  const expected = itemId
                    ? (snapshot[itemId]?.onHand ?? item.openingCount)
                    : item.openingCount;
                  const inputValue = itemId && itemId in enteredQuantities
                    ? String(enteredQuantities[itemId])
                    : "";

                  return (
                    <TableRow key={itemId ?? item.name} className="hover:bg-surface-2">
                      <TableCell className="p-2">{item.name}</TableCell>
                      <TableCell className="p-2">{item.unit}</TableCell>
                      <TableCell className="p-2 text-end">{expected}</TableCell>
                      <TableCell className="p-2 text-end">
                        <input
                          className="w-24 rounded-lg border border-border-2 px-2 py-1 text-end"
                          disabled={!itemId || isCategoryComplete}
                          inputMode="decimal"
                          min={0}
                          step="any"
                          type="number"
                          value={inputValue}
                          onChange={(event) => {
                            if (!itemId) {
                              return;
                            }

                            handleQuantityChange(itemId, event.target.value);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {isCategoryComplete && (
              <div className="mt-4 rounded-lg border border-border-2 bg-surface-2 p-3">
                {varianceRows.length > 0 ? (
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="p-2 text-start">Item</TableHead>
                        <TableHead className="p-2 text-end">Expected</TableHead>
                        <TableHead className="p-2 text-end">Counted</TableHead>
                        <TableHead className="p-2 text-end">Delta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {varianceRows.map((row) => (
                        <TableRow key={row.itemId}>
                          <TableCell className="p-2">{row.name}</TableCell>
                          <TableCell className="p-2 text-end">{row.expected}</TableCell>
                          <TableCell className="p-2 text-end">{row.counted}</TableCell>
                          <TableCell
                            className={`p-2 text-end ${
                              row.delta > 0
                                ? "text-success-main"
                                : row.delta < 0
                                  ? "text-error-main"
                                  : ""
                            }`}
                          >
                            {formatDelta(row.delta)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No quantities entered for this category.
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
      {pendingBatch && (
        <PasswordReauthModal
          title="Confirm batch count"
          instructions="Enter your password to confirm the batch count with large variances."
          onCancel={() => setPendingBatch(null)}
          onSuccess={async () => {
            if (!pendingBatch || submittingCategory) {
              return;
            }

            try {
              await executeCategorySubmit(
                pendingBatch.category,
                pendingBatch.categoryItems
              );
            } finally {
              setPendingBatch(null);
            }
          }}
        />
      )}
    </div>
  );
}
