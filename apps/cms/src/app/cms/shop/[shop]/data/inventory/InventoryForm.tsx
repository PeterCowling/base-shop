"use client";

/* eslint-disable ds/no-physical-direction-classes-in-rtl -- CMS-0001 [ttl=2026-12-31] legacy layout pending RTL refactor */

import { Button } from "@/components/atoms/shadcn";
import type { InventoryItem } from "@platform-core/types/inventory";
import { FormEvent, useCallback, useState } from "react";
import { InventoryTable } from "./InventoryTable";
import { InventoryToolbar } from "./InventoryToolbar";
import { useInventoryEditor } from "./hooks/useInventoryEditor";
import { useInventoryFileTransfer } from "./hooks/useInventoryFileTransfer";
import { useInventoryValidation } from "./useInventoryValidation";

type InventoryHistoryEntry = {
  id: string;
  idempotencyKey: string | null;
  receivedAt: string;
  delta: number | null;
  previousQuantity: number | null;
  nextQuantity: number | null;
  note: string | null;
  source:
    | "inflow"
    | "adjustment"
    | "reverse_logistics"
    | "order_allocation"
    | "order_return";
  reason: string | null;
};

interface Props {
  shop: string;
  initial: InventoryItem[];
  /**
   * Optional callback invoked with validated and normalized inventory items
   * instead of posting to the API. Primarily used for testing.
   */
  onSave?: (items: InventoryItem[]) => void | Promise<void>;
}

export default function InventoryForm({ shop, initial, onSave }: Props) {
  const validate = useInventoryValidation();
  const {
    items,
    attributes,
    status,
    error,
    updateItem,
    addRow,
    addAttribute,
    deleteAttribute,
    deleteRow,
    replaceItems,
    markSaved,
    markError,
    resetStatus,
  } = useInventoryEditor(initial);

  const { fileInputRef, triggerImport, handleFileChange, exportInventory } =
    useInventoryFileTransfer({
      shop,
      onItemsLoaded: replaceItems,
      onSuccess: markSaved,
      onError: markError,
    });

  const handleAddAttribute = useCallback(() => {
    const name = prompt("Attribute name")?.trim();
    if (!name || attributes.includes(name)) return;
    addAttribute(name);
  }, [addAttribute, attributes]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = validate(items);
    if (!result.success) {
      markError(result.error);
      return;
    }

    try {
      if (onSave) {
        await onSave(result.data);
        markSaved();
        return;
      }

      const res = await fetch(`/api/data/${shop}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        markError(body.error || "Failed to save");
        return;
      }
      markSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      markError(message);
    }
  };

  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(
    async (item: InventoryItem) => {
      setHistoryTarget(item);
      setHistory([]);
      setHistoryError(null);
      setHistoryLoading(true);
      try {
        const variant = encodeURIComponent(JSON.stringify(item.variantAttributes ?? {}));
        const res = await fetch(
          `/api/data/${shop}/inventory/history?sku=${encodeURIComponent(item.sku)}&variant=${variant}`,
        );
        const json = (await res.json()) as { items?: InventoryHistoryEntry[]; error?: string };
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to load history");
        }
        const rows =
          json.items?.map((row) => ({
            id: row.id,
            idempotencyKey: row.idempotencyKey ?? null,
            receivedAt: row.receivedAt,
            delta: row.delta ?? null,
            previousQuantity: row.previousQuantity ?? null,
            nextQuantity: row.nextQuantity ?? null,
            note: row.note ?? null,
            source: row.source,
            reason: row.reason ?? null,
          })) ?? [];
        setHistory(rows);
      } catch (err) {
        setHistoryError((err as Error).message);
      } finally {
        setHistoryLoading(false);
      }
    },
    [shop],
  );

  const closeHistory = useCallback(() => {
    setHistoryTarget(null);
    setHistory([]);
    setHistoryError(null);
  }, []);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <InventoryToolbar
        status={status}
        error={error}
        onAddRow={addRow}
        onAddAttribute={handleAddAttribute}
        onImport={triggerImport}
        onExport={exportInventory}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
      />

      <InventoryTable
        items={items}
        attributes={attributes}
        onDeleteAttribute={deleteAttribute}
        onUpdateItem={updateItem}
        onDeleteRow={deleteRow}
        onShowHistory={(item) => {
          resetStatus();
          loadHistory(item);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          type="submit"
          className="h-10 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
        >
          Save inventory
        </Button>
      </div>

      {historyTarget && (
        <div className="rounded-2xl border border-border/10 bg-surface-1 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                History: {historyTarget.sku} {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}
              </h3>
              {Object.keys(historyTarget.variantAttributes).length ? (
                <p className="text-xs text-muted-foreground">
                  {Object.entries(historyTarget.variantAttributes)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(", ")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No variant attributes</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={closeHistory}
            >
              Close
            </Button>
          </div>
          {historyLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading… {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</p>
          ) : historyError ? (
            <p className="mt-3 text-sm text-danger-foreground">{historyError}</p>
          ) : history.length ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border/10">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-2 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">When {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</th>
                    <th className="px-3 py-2 text-left font-semibold">Source {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</th>
                    <th className="px-3 py-2 text-left font-semibold">Delta {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</th>
                    <th className="px-3 py-2 text-left font-semibold">Previous {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</th>
                    <th className="px-3 py-2 text-left font-semibold">Next {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</th>
                    <th className="px-3 py-2 text-left font-semibold">Reason/Note {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-t border-border/10">
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(row.receivedAt).toLocaleString("en-GB", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.source === "inflow"
                          ? "Inflow"
                          : row.source === "adjustment"
                            ? "Adjustment"
                            : "Reverse logistics"}
                      </td>
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {row.delta === null ? "—" : row.delta > 0 ? `+${row.delta}` : row.delta}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.previousQuantity === null ? "—" : row.previousQuantity}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.nextQuantity === null ? "—" : row.nextQuantity}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.reason ? `${row.reason}${row.note ? " · " : ""}` : ""}
                        {row.note || (row.reason ? "" : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No inflow history yet. {/* i18n-exempt -- COM-LEDGER temporary UI copy [ttl=2026-12-31] */}</p>
          )}
        </div>
      )}
    </form>
  );
}
