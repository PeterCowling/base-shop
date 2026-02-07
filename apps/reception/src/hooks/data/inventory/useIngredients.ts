import { useCallback, useEffect, useMemo, useState } from "react";
import { get, ref, remove } from "firebase/database";

import { useFirebaseDatabase } from "../../../services/useFirebase";
import { buildInventorySnapshot } from "../../../utils/inventoryLedger";
import { showToast } from "../../../utils/toastUtils";
import { useInventoryItemsMutations } from "../../mutations/useInventoryItemsMutations";
import { useInventoryLedgerMutations } from "../../mutations/useInventoryLedgerMutations";

import useInventoryItems from "./useInventoryItems";
import useInventoryLedger from "./useInventoryLedger";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

export type IngredientsMap = Record<string, Ingredient>;

export default function useIngredients() {
  const database = useFirebaseDatabase();
  const [legacyIngredients, setLegacyIngredients] = useState<
    Record<string, { quantity: number }>
  >({});
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacyError, setLegacyError] = useState<unknown>(null);
  const { items, itemsById, loading: itemsLoading, error: itemsError } =
    useInventoryItems();
  const { entries, loading: ledgerLoading, error: ledgerError } =
    useInventoryLedger();
  const { createInventoryItem, saveInventoryItem } =
    useInventoryItemsMutations();
  const { addLedgerEntry } = useInventoryLedgerMutations();
  const [mutationError, setMutationError] = useState<unknown>(null);
  const [migrationError, setMigrationError] = useState<unknown>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadLegacy = async () => {
      setLegacyLoading(true);
      setLegacyError(null);
      try {
        const snap = await get(ref(database, "inventory/ingredients"));
        if (!isMounted) return;
        setLegacyIngredients(
          snap.exists() ? (snap.val() as Record<string, { quantity: number }>) : {}
        );
      } catch (err) {
        if (!isMounted) return;
        setLegacyError(err);
      } finally {
        if (isMounted) {
          setLegacyLoading(false);
        }
      }
    };

    if (database) {
      void loadLegacy();
    }
    return () => {
      isMounted = false;
    };
  }, [database]);

  const ingredients = useMemo(() => {
    if (!items.length) return {} as IngredientsMap;
    const snapshot = buildInventorySnapshot(itemsById, entries);
    const mapped: IngredientsMap = {};
    items
      .filter(
        (item) =>
          (item.category ?? "").toLowerCase() === "ingredient" && item.id
      )
      .forEach((item) => {
        const onHand =
          snapshot[item.id as string]?.onHand ?? item.openingCount ?? 0;
        mapped[item.name] = {
          id: item.id as string,
          name: item.name,
          unit: item.unit,
          quantity: onHand,
        };
      });
    return mapped;
  }, [items, itemsById, entries]);

  const updateIngredient = useCallback(
    async (name: string, quantity: number): Promise<void> => {
      try {
        const item = items.find(
          (entry) => entry.name.toLowerCase() === name.toLowerCase()
        );
        if (!item?.id) {
          showToast(`Ingredient not found: ${name}`, "error");
          return;
        }
        const current = ingredients[item.name]?.quantity ?? item.openingCount ?? 0;
        const delta = quantity - current;
        if (delta === 0) {
          showToast("Count matches expected on-hand.", "info");
          return;
        }
        await addLedgerEntry({
          itemId: item.id,
          type: "count",
          quantity: delta,
          reason: "ingredient count update",
          unit: item.unit,
        });
      } catch (err) {
        setMutationError(err);
        throw err;
      }
    },
    [addLedgerEntry, ingredients, items]
  );

  const decrementIngredient = useCallback(
    async (name: string, amount: number): Promise<void> => {
      try {
        const item = items.find(
          (entry) => entry.name.toLowerCase() === name.toLowerCase()
        );
        if (!item?.id) {
          showToast(`Ingredient not found: ${name}`, "error");
          return;
        }
        await addLedgerEntry({
          itemId: item.id,
          type: "sale",
          quantity: -Math.abs(amount),
          reason: "ingredient usage",
          unit: item.unit,
        });
      } catch (err) {
        setMutationError(err);
        throw err;
      }
    },
    [addLedgerEntry, items]
  );

  const migrateLegacyIngredients = useCallback(
    async (options?: { removeLegacy?: boolean }) => {
      if (itemsLoading || ledgerLoading) {
        showToast("Inventory data still loading. Please try again.", "warning");
        return;
      }
      if (!legacyIngredients || Object.keys(legacyIngredients).length === 0) {
        showToast("No legacy ingredients to migrate.", "info");
        return;
      }

      setMigrationLoading(true);
      setMigrationError(null);
      try {
        const ledgerByItem = entries.reduce<Record<string, number>>(
          (acc, entry) => {
            acc[entry.itemId] = (acc[entry.itemId] ?? 0) + 1;
            return acc;
          },
          {}
        );

        for (const [name, info] of Object.entries(legacyIngredients)) {
          const legacyQty = info.quantity ?? 0;
          const existing = items.find(
            (item) => item.name.toLowerCase() === name.toLowerCase()
          );

          let itemId = existing?.id ?? null;
          if (!itemId) {
            itemId = await createInventoryItem({
              name,
              unit: "unit",
              openingCount: 0,
              category: "ingredient",
              active: true,
            });
          } else if (
            existing &&
            (existing.category ?? "").toLowerCase() !== "ingredient"
          ) {
            await saveInventoryItem(itemId, {
              ...existing,
              category: "ingredient",
            });
          }

          if (!itemId) {
            continue;
          }

          const hasLedger = Boolean(ledgerByItem[itemId]);
          if (!hasLedger) {
            if (!existing) {
              await addLedgerEntry({
                itemId,
                type: "opening",
                quantity: legacyQty,
                reason: "legacy ingredient migration",
                note: "legacy-migration",
                unit: "unit",
              });
            } else if (legacyQty !== existing.openingCount) {
              const delta = legacyQty - existing.openingCount;
              if (delta !== 0) {
                await addLedgerEntry({
                  itemId,
                  type: "count",
                  quantity: delta,
                  reason: "legacy ingredient migration",
                  note: "legacy-migration",
                  unit: existing.unit,
                });
              }
            }
          }
        }

        if (options?.removeLegacy) {
          await remove(ref(database, "inventory/ingredients"));
        }
        setMigrationComplete(true);
        showToast("Legacy ingredients migrated.", "success");
      } catch (err) {
        setMigrationError(err);
        showToast("Failed to migrate legacy ingredients.", "error");
        throw err;
      } finally {
        setMigrationLoading(false);
      }
    },
    [
      addLedgerEntry,
      createInventoryItem,
      database,
      entries,
      items,
      itemsLoading,
      legacyIngredients,
      ledgerLoading,
      saveInventoryItem,
    ]
  );

  const error =
    mutationError || itemsError || ledgerError || legacyError || migrationError;
  const loading = itemsLoading || ledgerLoading || legacyLoading || migrationLoading;

  return useMemo(
    () => ({
      ingredients,
      loading,
      error,
      updateIngredient,
      decrementIngredient,
      legacyIngredients,
      migrateLegacyIngredients,
      migrationComplete,
    }),
    [
      ingredients,
      loading,
      error,
      updateIngredient,
      decrementIngredient,
      legacyIngredients,
      migrateLegacyIngredients,
      migrationComplete,
    ]
  );
}
