"use client";

import { useState } from "react";

import type { InventoryItem } from "@acme/platform-core/repositories/inventory.server";

interface InventoryEditorProps {
  productSku: string;
  inventoryItems: InventoryItem[];
}

export function InventoryEditor({ productSku, inventoryItems }: InventoryEditorProps) {
  const item = inventoryItems.find((i) => i.sku === productSku) ?? null;

  const [quantity, setQuantity] = useState(item?.quantity ?? 0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (quantity < 0) return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/admin/api/inventory/${encodeURIComponent(productSku)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          variantAttributes: item?.variantAttributes ?? {},
        }),
      });
      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Update failed.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error.");
      setStatus("error");
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-border p-6">
      <h2 className="mb-4 text-lg font-medium">Inventory</h2>
      {item ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Low-stock threshold: {item.lowStockThreshold ?? "—"}
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          No inventory record found for this SKU. Saving will create one.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-4">
        <div className="space-y-1.5">
          <label htmlFor="inv-quantity" className="block text-sm font-medium">
            Quantity
          </label>
          <input
            id="inv-quantity"
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            className="w-28 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className="btn-primary min-h-[44px] rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Update stock"}
        </button>
        {status === "saved" ? (
          <span className="text-sm text-green-600">Saved!</span>
        ) : null}
        {status === "error" ? (
          <span className="text-sm text-destructive">{errorMsg}</span>
        ) : null}
      </form>
    </section>
  );
}
