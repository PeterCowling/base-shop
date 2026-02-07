import { useMemo, useState } from "react";

import {
  STOCK_ADJUSTMENT_REAUTH_THRESHOLD,
  STOCK_SHRINKAGE_ALERT_THRESHOLD,
} from "../../constants/stock";
import { useAuth } from "../../context/AuthContext";
import useProductsHook from "../../hooks/data/bar/useProducts";
import useInventoryItems from "../../hooks/data/inventory/useInventoryItems";
import useInventoryLedger from "../../hooks/data/inventory/useInventoryLedger";
import useInventoryRecipes from "../../hooks/data/inventory/useInventoryRecipes";
import { useInventoryItemsMutations } from "../../hooks/mutations/useInventoryItemsMutations";
import { useInventoryLedgerMutations } from "../../hooks/mutations/useInventoryLedgerMutations";
import { useInventoryRecipesMutations } from "../../hooks/mutations/useInventoryRecipesMutations";
import { canAccess,Permissions } from "../../lib/roles";
import { buildInventorySnapshot } from "../../utils/inventoryLedger";
import { showToast } from "../../utils/toastUtils";
import PasswordReauthModal from "../common/PasswordReauthModal";

type StockAction =
  | "receive"
  | "adjust"
  | "waste"
  | "count"
  | "transferIn"
  | "transferOut";

interface ActionState {
  action: StockAction;
  quantity: string;
  reason: string;
  reference: string;
  note: string;
}

const defaultActionState: ActionState = {
  action: "receive",
  quantity: "",
  reason: "",
  reference: "",
  note: "",
};

function StockManagement() {
  const { user } = useAuth();
  const canManageStock = canAccess(user, Permissions.STOCK_ACCESS);
  const { allProducts } = useProductsHook();
  const { items, itemsById, loading, error } = useInventoryItems();
  const { entries } = useInventoryLedger();
  const { recipes } = useInventoryRecipes();
  const { createInventoryItem } = useInventoryItemsMutations();
  const { addLedgerEntry } = useInventoryLedgerMutations();
  const { saveRecipe, removeRecipe } = useInventoryRecipesMutations();
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});
  const [newItem, setNewItem] = useState({
    name: "",
    unit: "",
    openingCount: "",
    reorderThreshold: "",
    category: "",
  });
  const [pendingAction, setPendingAction] = useState<{
    itemId: string;
    action: StockAction;
    quantity: number;
    reason: string;
    reference: string;
    note: string;
    unit: string;
  } | null>(null);

  const snapshot = useMemo(
    () => buildInventorySnapshot(itemsById, entries),
    [itemsById, entries]
  );

  const productItemIdByName = useMemo(() => {
    return items.reduce<Record<string, string>>((acc, item) => {
      if (!item.id) return acc;
      if ((item.category ?? "").toLowerCase() === "ingredient") return acc;
      acc[item.name.toLowerCase()] = item.id;
      return acc;
    }, {});
  }, [items]);

  const missingRecipeItems = useMemo(() => {
    const missingItems: string[] = [];
    const missingInventory: string[] = [];
    allProducts
      .filter((product) => product.price > 0)
      .forEach((product) => {
        if (product.categoryType === "Other") return;
        const itemId = productItemIdByName[product.name.toLowerCase()];
        if (!itemId) {
          missingInventory.push(product.name);
          return;
        }
        if (!recipes[itemId]) {
          missingItems.push(product.name);
        }
      });
    return {
      missingItems: missingItems.sort(),
      missingInventory: missingInventory.sort(),
    };
  }, [allProducts, productItemIdByName, recipes]);

  const legacyRecipes = useMemo(() => {
    return Object.keys(recipes).filter((key) => !itemsById[key]);
  }, [recipes, itemsById]);

  const lowStockItems = useMemo(() => {
    return items
      .filter((item) => {
        const threshold = item.reorderThreshold ?? 0;
        if (threshold <= 0) return false;
        const onHand = snapshot[item.id ?? ""]?.onHand ?? item.openingCount;
        return onHand <= threshold;
      })
      .map((item) => ({
        itemId: item.id ?? "",
        name: item.name,
        onHand: snapshot[item.id ?? ""]?.onHand ?? item.openingCount,
        threshold: item.reorderThreshold ?? 0,
      }));
  }, [items, snapshot]);

  const countEntries = useMemo(
    () =>
      entries.filter((entry) => entry.type === "count").sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp)
      ),
    [entries]
  );

  const countVarianceSummary = useMemo(() => {
    return countEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.itemId] = (acc[entry.itemId] ?? 0) + entry.quantity;
      return acc;
    }, {});
  }, [countEntries]);

  const shrinkageAlerts = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const shrinkageTypes = new Set(["waste", "adjust", "count"]);
    const totals = entries.reduce<Record<string, number>>((acc, entry) => {
      if (
        entry.quantity >= 0 ||
        !shrinkageTypes.has(entry.type) ||
        new Date(entry.timestamp).getTime() < cutoff
      ) {
        return acc;
      }
      acc[entry.itemId] = (acc[entry.itemId] ?? 0) + Math.abs(entry.quantity);
      return acc;
    }, {});

    return Object.entries(totals)
      .filter(([, total]) => total >= STOCK_SHRINKAGE_ALERT_THRESHOLD)
      .map(([itemId, total]) => ({
        itemId,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [entries]);

  if (!canManageStock) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
          You do not have access to stock management.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-error-main">Error loading inventory.</p>
      </div>
    );
  }

  const handleActionChange = (
    itemId: string,
    field: keyof ActionState,
    value: string
  ) => {
    setActionState((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] ?? defaultActionState),
        [field]: value,
      },
    }));
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.unit.trim()) {
      showToast("Item name and unit are required.", "error");
      return;
    }
    const openingCount = Number(newItem.openingCount || 0);
    const reorderThreshold = newItem.reorderThreshold
      ? Number(newItem.reorderThreshold)
      : undefined;

    await createInventoryItem({
      name: newItem.name.trim(),
      unit: newItem.unit.trim(),
      openingCount: Number.isNaN(openingCount) ? 0 : openingCount,
      reorderThreshold:
        reorderThreshold !== undefined && !Number.isNaN(reorderThreshold)
          ? reorderThreshold
          : undefined,
      category: newItem.category.trim() || undefined,
      active: true,
    });

    setNewItem({
      name: "",
      unit: "",
      openingCount: "",
      reorderThreshold: "",
      category: "",
    });
  };

  const handleMigrateLegacyRecipes = async () => {
    if (legacyRecipes.length === 0) return;
    if (
      !window.confirm(
        `Migrate ${legacyRecipes.length} legacy recipe keys to inventory item IDs?`
      )
    ) {
      return;
    }

    let migrated = 0;
    let skipped = 0;
    for (const legacyKey of legacyRecipes) {
      const matchingItem = items.find(
        (item) => item.name.toLowerCase() === legacyKey.toLowerCase()
      );
      if (!matchingItem?.id) {
        skipped += 1;
        continue;
      }
      const recipe = recipes[legacyKey];
      if (!recipe) {
        skipped += 1;
        continue;
      }
      await saveRecipe(matchingItem.id, recipe);
      await removeRecipe(legacyKey);
      migrated += 1;
    }

    showToast(
      `Recipes migrated: ${migrated}, skipped: ${skipped}`,
      migrated > 0 ? "success" : "warning"
    );
  };

  const finalizeLedgerEntry = async (pending: {
    itemId: string;
    action: StockAction;
    quantity: number;
    reason: string;
    reference: string;
    note: string;
    unit: string;
  }) => {
    const { itemId, action, quantity, reason, reference, note, unit } = pending;
    const item = itemsById[itemId];
    if (!item) {
      showToast("Item not found.", "error");
      return;
    }

    let type: "receive" | "adjust" | "waste" | "count" | "transfer" = "adjust";
    let signedQuantity = quantity;
    let entryNote = note.trim();

    switch (action) {
      case "receive":
        type = "receive";
        signedQuantity = Math.abs(quantity);
        break;
      case "adjust":
        type = "adjust";
        break;
      case "waste":
        type = "waste";
        signedQuantity = -Math.abs(quantity);
        break;
      case "transferIn":
        type = "transfer";
        signedQuantity = Math.abs(quantity);
        entryNote = entryNote ? `transfer-in: ${entryNote}` : "transfer-in";
        break;
      case "transferOut":
        type = "transfer";
        signedQuantity = -Math.abs(quantity);
        entryNote = entryNote ? `transfer-out: ${entryNote}` : "transfer-out";
        break;
      case "count":
        type = "count";
        break;
      default:
        break;
    }

    try {
      await addLedgerEntry({
        itemId,
        type,
        quantity: signedQuantity,
        reason: reason.trim() || undefined,
        reference: reference.trim() || undefined,
        note: entryNote || undefined,
        unit: unit || item.unit,
      });
      showToast("Stock movement recorded.", "success");
    } catch (err) {
      console.error("Failed to record inventory entry", err);
      showToast("Failed to record stock movement.", "error");
    }
  };

  const handleRecordAction = async (itemId: string) => {
    const item = itemsById[itemId];
    if (!item) return;
    const state = actionState[itemId] ?? defaultActionState;
    const rawQuantity = Number(state.quantity);
    if (Number.isNaN(rawQuantity) || rawQuantity === 0) {
      showToast("Quantity must be a non-zero number.", "error");
      return;
    }

    const requiresReason =
      state.action !== "receive" && state.action !== "transferIn";
    if (requiresReason && !state.reason.trim()) {
      showToast("Reason is required for this action.", "error");
      return;
    }

    let quantity = rawQuantity;
    if (state.action === "count") {
      const expected = snapshot[itemId]?.onHand ?? item.openingCount;
      const delta = rawQuantity - expected;
      if (delta === 0) {
        showToast("Count matches expected on-hand.", "info");
        return;
      }
      quantity = delta;
    }

    const needsReauth =
      Math.abs(quantity) >= STOCK_ADJUSTMENT_REAUTH_THRESHOLD;

    const pending = {
      itemId,
      action: state.action,
      quantity,
      reason: state.reason,
      reference: state.reference,
      note: state.note,
      unit: item.unit,
    };

    if (needsReauth) {
      setPendingAction(pending);
      return;
    }

    await finalizeLedgerEntry(pending);
  };

  const escapeCsvCell = (value: string) => {
    let str = value;
    // Prevent formula injection - Excel/Sheets treat these as formula starters
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const buildCsv = (headers: string[], rows: string[][]) =>
    [headers.join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join(
      "\n"
    );

  const triggerCsvDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportLedger = () => {
    const headers = [
      "Recorded at",
      "Item",
      "Item ID",
      "Type",
      "Quantity",
      "Unit",
      "User",
      "Reason",
      "Reference",
      "Note",
      "Shift ID",
    ];
    const rows = entries.map((entry) => [
      entry.timestamp,
      itemsById[entry.itemId]?.name ?? entry.itemId,
      entry.itemId,
      entry.type,
      String(entry.quantity),
      entry.unit ?? "",
      entry.user,
      entry.reason ?? "",
      entry.reference ?? "",
      entry.note ?? "",
      entry.shiftId ?? "",
    ]);

    const csvContent = buildCsv(headers, rows);
    const filename = `inventory-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    triggerCsvDownload(csvContent, filename);
    showToast(
      `Exported ${entries.length} ledger record${entries.length !== 1 ? "s" : ""}`,
      "success"
    );
  };

  const handleExportVariance = () => {
    const headers = [
      "Recorded at",
      "Item",
      "Item ID",
      "Variance",
      "User",
      "Reason",
      "Note",
    ];
    const rows = countEntries.map((entry) => [
      entry.timestamp,
      itemsById[entry.itemId]?.name ?? entry.itemId,
      entry.itemId,
      String(entry.quantity),
      entry.user,
      entry.reason ?? "",
      entry.note ?? "",
    ]);
    const csvContent = buildCsv(headers, rows);
    const filename = `inventory-variance-${new Date().toISOString().slice(0, 10)}.csv`;
    triggerCsvDownload(csvContent, filename);
    showToast(
      `Exported ${countEntries.length} variance record${
        countEntries.length !== 1 ? "s" : ""
      }`,
      "success"
    );
  };

  return (
    <div className="p-4 dark:bg-darkBg dark:text-darkAccentGreen space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Stock Management</h1>
        <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
          Track inventory with ledger-based movements and accountability.
        </p>
      </div>

      {(missingRecipeItems.missingItems.length > 0 ||
        missingRecipeItems.missingInventory.length > 0 ||
        legacyRecipes.length > 0) && (
        <section className="border border-warning-main rounded p-4 bg-warning-light/10">
          <h2 className="text-xl font-semibold mb-2 text-warning-main">
            Recipe Coverage Warnings
          </h2>
          {missingRecipeItems.missingInventory.length > 0 && (
            <p className="text-sm mb-2">
              Missing inventory items for{" "}
              {missingRecipeItems.missingInventory.length} menu products.
            </p>
          )}
          {missingRecipeItems.missingItems.length > 0 && (
            <p className="text-sm mb-2">
              Missing recipes for {missingRecipeItems.missingItems.length} menu
              products with inventory items.
            </p>
          )}
          {legacyRecipes.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="mb-2">
                {legacyRecipes.length} recipe entries are still keyed by product
                name. Migrate them to inventory item IDs.
              </p>
              <button
                type="button"
                className="px-3 py-1 rounded bg-warning-main text-white hover:bg-warning-dark"
                onClick={handleMigrateLegacyRecipes}
              >
                Migrate Legacy Recipes
              </button>
            </div>
          )}
        </section>
      )}

      <section className="border border-gray-200 rounded p-4 dark:border-darkBorder">
        <h2 className="text-xl font-semibold mb-3">Add Inventory Item</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Name"
            className="border px-2 py-1 dark:bg-darkSurface dark:text-darkAccentGreen"
            value={newItem.name}
            onChange={(e) =>
              setNewItem((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Unit (e.g. kg)"
            className="border px-2 py-1 dark:bg-darkSurface dark:text-darkAccentGreen"
            value={newItem.unit}
            onChange={(e) =>
              setNewItem((prev) => ({ ...prev, unit: e.target.value }))
            }
          />
          <input
            type="number"
            placeholder="Opening Count"
            className="border px-2 py-1 dark:bg-darkSurface dark:text-darkAccentGreen"
            value={newItem.openingCount}
            onChange={(e) =>
              setNewItem((prev) => ({
                ...prev,
                openingCount: e.target.value,
              }))
            }
          />
          <input
            type="number"
            placeholder="Reorder Threshold"
            className="border px-2 py-1 dark:bg-darkSurface dark:text-darkAccentGreen"
            value={newItem.reorderThreshold}
            onChange={(e) =>
              setNewItem((prev) => ({
                ...prev,
                reorderThreshold: e.target.value,
              }))
            }
          />
          <input
            type="text"
            placeholder="Category"
            className="border px-2 py-1 dark:bg-darkSurface dark:text-darkAccentGreen"
            value={newItem.category}
            onChange={(e) =>
              setNewItem((prev) => ({ ...prev, category: e.target.value }))
            }
          />
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-3 inline-flex min-h-11 min-w-11 items-center justify-center px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
        >
          Add Item
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Inventory Ledger</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
            No inventory items added yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm dark:bg-darkSurface border border-gray-200 dark:border-darkBorder">
              <thead>
                <tr className="bg-gray-100 dark:bg-darkSurface">
                  <th className="p-2 text-start">Item</th>
                  <th className="p-2 text-start">Unit</th>
                  <th className="p-2 text-end">On Hand</th>
                  <th className="p-2 text-end">Reorder</th>
                  <th className="p-2 text-start">Last Movement</th>
                  <th className="p-2 text-start">Action</th>
                  <th className="p-2 text-start">Details</th>
                  <th className="p-2 text-start">Reason</th>
                  <th className="p-2 text-start">Reference</th>
                  <th className="p-2 text-start">Note</th>
                  <th className="p-2 text-start">Record</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const onHand = snapshot[item.id ?? ""]?.onHand ?? item.openingCount;
                  const reorderThreshold = item.reorderThreshold ?? 0;
                  const lowStock =
                    reorderThreshold > 0 && onHand <= reorderThreshold;
                  const lastMovement = snapshot[item.id ?? ""]?.lastMovementAt ?? "-";
                  const state = actionState[item.id ?? ""] ?? defaultActionState;

                  return (
                    <tr
                      key={item.id ?? item.name}
                      className={lowStock ? "bg-red-50 dark:bg-darkSurface" : ""}
                    >
                      <td className="p-2 border-b">{item.name}</td>
                      <td className="p-2 border-b">{item.unit}</td>
                      <td className="p-2 border-b text-end">{onHand}</td>
                      <td className="p-2 border-b text-end">
                        {item.reorderThreshold ?? "-"}
                      </td>
                      <td className="p-2 border-b">{lastMovement}</td>
                      <td className="p-2 border-b">
                        <select
                          className="border px-2 py-1 dark:bg-darkSurface dark:text-darkAccentGreen"
                          value={state.action}
                          onChange={(e) =>
                            handleActionChange(
                              item.id ?? "",
                              "action",
                              e.target.value
                            )
                          }
                        >
                          <option value="receive">Receive</option>
                          <option value="adjust">Adjust</option>
                          <option value="waste">Waste</option>
                          <option value="count">Count</option>
                          <option value="transferIn">Transfer In</option>
                          <option value="transferOut">Transfer Out</option>
                        </select>
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          placeholder="Quantity"
                          className="border px-2 py-1 w-24 dark:bg-darkSurface dark:text-darkAccentGreen"
                          value={state.quantity}
                          onChange={(e) =>
                            handleActionChange(
                              item.id ?? "",
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="text"
                          placeholder="Reason"
                          className="border px-2 py-1 w-40 dark:bg-darkSurface dark:text-darkAccentGreen"
                          value={state.reason}
                          onChange={(e) =>
                            handleActionChange(
                              item.id ?? "",
                              "reason",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="text"
                          placeholder="Reference"
                          className="border px-2 py-1 w-32 dark:bg-darkSurface dark:text-darkAccentGreen"
                          value={state.reference}
                          onChange={(e) =>
                            handleActionChange(
                              item.id ?? "",
                              "reference",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="text"
                          placeholder="Note"
                          className="border px-2 py-1 w-32 dark:bg-darkSurface dark:text-darkAccentGreen"
                          value={state.note}
                          onChange={(e) =>
                            handleActionChange(
                              item.id ?? "",
                              "note",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2 border-b">
                        <button
                          type="button"
                          onClick={() => handleRecordAction(item.id ?? "")}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-1 rounded bg-primary-main text-white hover:bg-primary-dark"
                        >
                          Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border border-gray-200 rounded p-4 dark:border-darkBorder">
        <h2 className="text-xl font-semibold mb-3">Alerts</h2>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
            No low stock items.
          </p>
        ) : (
          <ul className="text-sm space-y-1">
            {lowStockItems.map((item) => (
              <li key={item.itemId} className="text-warning-main">
                {item.name}: {item.onHand} on hand (threshold {item.threshold})
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Shrinkage</h3>
          {shrinkageAlerts.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
              No abnormal shrinkage detected in the last 24 hours.
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {shrinkageAlerts.map((alert) => (
                <li key={alert.itemId} className="text-error-main">
                  {itemsById[alert.itemId]?.name ?? alert.itemId}: {alert.total}{" "}
                  units removed in 24h
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border border-gray-200 rounded p-4 dark:border-darkBorder">
        <h2 className="text-xl font-semibold mb-3">Exports</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportLedger}
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
          >
            Export Ledger CSV
          </button>
          <button
            type="button"
            onClick={handleExportVariance}
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
          >
            Export Variance CSV
          </button>
        </div>
      </section>

      <section className="border border-gray-200 rounded p-4 dark:border-darkBorder">
        <h2 className="text-xl font-semibold mb-3">Count Variance Report</h2>
        {countEntries.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
            No count adjustments recorded yet.
          </p>
        ) : (
          <>
            <table className="min-w-full text-sm dark:bg-darkSurface border border-gray-200 dark:border-darkBorder">
              <thead>
                <tr className="bg-gray-100 dark:bg-darkSurface">
                  <th className="p-2 text-start">Time</th>
                  <th className="p-2 text-start">Item</th>
                  <th className="p-2 text-end">Variance</th>
                  <th className="p-2 text-start">User</th>
                  <th className="p-2 text-start">Reason</th>
                </tr>
              </thead>
              <tbody>
                {countEntries.slice(0, 25).map((entry) => (
                  <tr key={entry.id ?? `${entry.itemId}-${entry.timestamp}`}>
                    <td className="p-2 border-b">{entry.timestamp}</td>
                    <td className="p-2 border-b">
                      {itemsById[entry.itemId]?.name ?? entry.itemId}
                    </td>
                    <td className="p-2 border-b text-end">{entry.quantity}</td>
                    <td className="p-2 border-b">{entry.user}</td>
                    <td className="p-2 border-b">{entry.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Variance by Item</h3>
              <table className="min-w-full text-sm dark:bg-darkSurface border border-gray-200 dark:border-darkBorder">
                <thead>
                  <tr className="bg-gray-100 dark:bg-darkSurface">
                    <th className="p-2 text-start">Item</th>
                    <th className="p-2 text-end">Total Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(countVarianceSummary).map(([itemId, total]) => (
                    <tr key={itemId}>
                      <td className="p-2 border-b">
                        {itemsById[itemId]?.name ?? itemId}
                      </td>
                      <td className="p-2 border-b text-end">{total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <p className="text-xs text-gray-600 dark:text-darkAccentGreen">
        Changes of {STOCK_ADJUSTMENT_REAUTH_THRESHOLD}+ units require re-authentication.
      </p>

      {pendingAction && (
        <PasswordReauthModal
          title="Confirm Stock Adjustment"
          instructions="Please re-enter your password to record this inventory change."
          onCancel={() => setPendingAction(null)}
          onSuccess={async () => {
            if (!pendingAction) return;
            try {
              await finalizeLedgerEntry(pendingAction);
            } finally {
              setPendingAction(null);
            }
          }}
        />
      )}
    </div>
  );
}

export default StockManagement;
