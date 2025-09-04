"use client";

import {
  Button,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";
import type { InventoryItem } from "@acme/types";
import { FormEvent, useRef, useState } from "react";
import InventoryRow from "./InventoryRow";
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
  const [items, setItems] = useState<InventoryItem[]>(() => initial);
  const [attributes, setAttributes] = useState<string[]>(() => {
    const set = new Set<string>();
    initial.forEach((i) =>
      Object.keys(i.variantAttributes ?? {}).forEach((k) => set.add(k))
    );
    return Array.from(set);
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const validate = useInventoryValidation();

  const updateItem = (
    index: number,
    field: keyof InventoryItem | `variantAttributes.${string}`,
    value: string
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] } as InventoryItem;
      if (field.startsWith("variantAttributes.")) {
        const key = field.split(".")[1];
        item.variantAttributes = { ...item.variantAttributes, [key]: value };
      } else if (field === "quantity") {
        item.quantity = value === "" ? NaN : Number(value);
      } else if (field === "lowStockThreshold") {
        item.lowStockThreshold = value === "" ? undefined : Number(value);
      } else if (field === "sku") {
        item.sku = value;
        item.productId = value;
      } else if (field === "productId") {
        item.productId = value;
      } else if (field === "wearCount") {
        item.wearCount = value === "" ? undefined : Number(value);
      } else if (field === "wearAndTearLimit") {
        item.wearAndTearLimit = value === "" ? undefined : Number(value);
      } else if (field === "maintenanceCycle") {
        item.maintenanceCycle = value === "" ? undefined : Number(value);
      }
      next[index] = item;
      return next;
    });
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        sku: "",
        productId: "",
        variantAttributes: Object.fromEntries(attributes.map((a) => [a, ""])),
        quantity: NaN,
        lowStockThreshold: undefined,
      },
    ]);
  };

  const addAttribute = () => {
    const name = prompt("Attribute name")?.trim();
    if (!name || attributes.includes(name)) return;
    setAttributes((prev) => [...prev, name]);
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes, [name]: "" },
      }))
    );
  };

  const deleteAttribute = (attr: string) => {
    setAttributes((prev) => prev.filter((a) => a !== attr));
    setItems((prev) =>
      prev.map((i) => {
        const rest = { ...i.variantAttributes };
        delete rest[attr];
        return { ...i, variantAttributes: rest };
      })
    );
  };

  const deleteRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = validate(items);
      if (!result.success) {
        setStatus("error");
        setError(result.error);
        return;
      }
      if (onSave) {
        await onSave(result.data);
        setStatus("saved");
        setError(null);
        return;
      }
      const res = await fetch(`/api/data/${shop}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(body.error || "Failed to save");
        return;
      }
      setStatus("saved");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  const onImport = () => {
    fileInput.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setItems(body.items);
      setAttributes(() => {
        const set = new Set<string>();
        body.items.forEach((i: InventoryItem) =>
          Object.keys(i.variantAttributes).forEach((k) => set.add(k))
        );
        return Array.from(set);
      });
      setStatus("saved");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onExport = async (format: "json" | "csv") => {
    try {
      const res = await fetch(
        `/api/data/${shop}/inventory/export?format=${format}`
      );
      if (!res.ok) {
        throw new Error("Failed to export");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "json" ? "inventory.json" : "inventory.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            {attributes.map((attr) => (
              <TableHead key={attr}>
                {attr}
                <Button
                  type="button"
                  onClick={() => deleteAttribute(attr)}
                  aria-label={`delete-attr-${attr}`}
                >
                  Delete
                </Button>
              </TableHead>
            ))}
            <TableHead>Quantity</TableHead>
            <TableHead>Low stock threshold</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <InventoryRow
              key={idx}
              item={item}
              index={idx}
              attributes={attributes}
              updateItem={updateItem}
              deleteRow={deleteRow}
            />
          ))}
        </TableBody>
      </Table>
      <Button type="button" onClick={addRow}>
        Add row
      </Button>
      <Button type="button" onClick={addAttribute}>
        Add attribute
      </Button>
      {status === "saved" && (
        <p className="text-sm text-green-600">Saved!</p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="space-x-2">
        <Button type="submit">Save</Button>
        <Button type="button" onClick={onImport}>
          Import JSON/CSV
        </Button>
        <Button type="button" onClick={() => onExport("json")}>
          Export JSON
        </Button>
        <Button type="button" onClick={() => onExport("csv")}>
          Export CSV
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={onFile}
      />
    </form>
  );
}

