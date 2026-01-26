/* i18n-exempt file -- COM-0001 ttl=2026-12-31 */

"use client";

import { useEffect, useState } from "react";

type InventorySnapshotRowBase = {
  sku: string;
  productId: string;
  quantity: number;
  variantAttributes: Record<string, string>;
};

export type InventorySnapshotRow = InventorySnapshotRowBase & { key: string };

function buildInventoryKey(item: InventorySnapshotRowBase): string {
  const variantPart = Object.entries(item.variantAttributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  return `${item.sku}::${variantPart || "no-variant"}`;
}

function parseInventorySnapshotPayload(json: Record<string, unknown>[]): InventorySnapshotRow[] {
  return json
    .map((item) => {
      const variantAttributes = Object.fromEntries(
        Object.entries(item)
          .filter(([key]) => key.startsWith("variant."))
          .map(([key, value]) => [key.slice("variant.".length), String(value)]),
      );

      const sku = String(item.sku ?? "").trim();
      const productId = String(item.productId ?? "").trim();
      const quantity = Number(item.quantity ?? 0);

      if (!sku || !productId || !Number.isFinite(quantity)) return null;
      const row: InventorySnapshotRowBase = { sku, productId, quantity, variantAttributes };
      return { ...row, key: buildInventoryKey(row) };
    })
    .filter((row): row is InventorySnapshotRow => Boolean(row));
}

export function useInventorySnapshot(shop: string) {
  const [inventory, setInventory] = useState<InventorySnapshotRow[]>([]);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        const res = await fetch(`/api/data/${shop}/inventory/export?format=json`);
        if (!res.ok) {
          const message =
            res.status === 403
              ? "Missing inventory permission"
              : "Unable to load inventory snapshot.";
          throw new Error(message);
        }
        const json = (await res.json()) as Record<string, unknown>[];
        const rows = parseInventorySnapshotPayload(json);
        if (!cancelled) {
          setInventory(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setInventoryError(err instanceof Error ? err.message : "Unable to load inventory snapshot.");
        }
      } finally {
        if (!cancelled) {
          setInventoryLoading(false);
        }
      }
    }

    loadInventory();
    return () => {
      cancelled = true;
    };
  }, [shop]);

  return { inventory, inventoryError, inventoryLoading };
}

