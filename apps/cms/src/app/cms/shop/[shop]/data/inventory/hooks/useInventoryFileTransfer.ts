import type { ChangeEvent } from "react";
import { useCallback, useRef } from "react";

import type { InventoryItem } from "@acme/platform-core/types/inventory";

interface InventoryFileTransferOptions {
  shop: string;
  onItemsLoaded: (items: InventoryItem[]) => void;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useInventoryFileTransfer({
  shop,
  onItemsLoaded,
  onSuccess,
  onError,
}: InventoryFileTransferOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const data = new FormData();
      data.set("file", file);

      try {
        const res = await fetch(`/api/data/${shop}/inventory/import`, {
          method: "POST",
          body: data,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || "Failed to import");
        }
        if (!Array.isArray(body.items)) {
          throw new Error("Invalid response from server");
        }

        const items = body.items as InventoryItem[];
        onItemsLoaded(items);
        onSuccess?.();
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Failed to import";
        onError?.(message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [shop, onItemsLoaded, onSuccess, onError],
  );

  const exportInventory = useCallback(
    (format: "json" | "csv") => {
      const url = `/api/data/${shop}/inventory/export?format=${format}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to export");
          }
        })
        .catch((err) => {
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Failed to export";
          onError?.(message);
        });

      const link = document.createElement("a");
      link.href = url;
      link.download = format === "json" ? "inventory.json" : "inventory.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [shop, onError],
  );

  return {
    fileInputRef,
    triggerImport,
    handleFileChange,
    exportInventory,
  };
}
