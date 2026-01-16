"use client";

import { Button } from "@/components/atoms/shadcn";
import type { InventoryItem } from "@acme/platform-core/types/inventory";
import { FormEvent, useCallback } from "react";
import { InventoryTable } from "./InventoryTable";
import { InventoryToolbar } from "./InventoryToolbar";
import { useInventoryEditor } from "./hooks/useInventoryEditor";
import { useInventoryFileTransfer } from "./hooks/useInventoryFileTransfer";
import { useInventoryValidation } from "./useInventoryValidation";

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
    </form>
  );
}
