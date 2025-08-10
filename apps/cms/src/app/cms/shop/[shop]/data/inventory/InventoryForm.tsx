"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { inventoryItemSchema, type InventoryItem } from "@types";
import { FormEvent, useRef, useState } from "react";

interface Props {
  shop: string;
  initial: InventoryItem[];
}

interface RowState {
  sku: string;
  variantAttributes: string;
  quantity: number;
  lowStockThreshold: number;
}

export default function InventoryForm({ shop, initial }: Props) {
  const mapItemToRow = (item: InventoryItem): RowState => ({
    sku: item.sku,
    variantAttributes: JSON.stringify((item as any).variantAttributes || {}),
    quantity: item.quantity,
    lowStockThreshold: (item as any).lowStockThreshold ?? 0,
  });

  const [rows, setRows] = useState<RowState[]>(() => initial.map(mapItemToRow));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateRow = (
    index: number,
    field: keyof RowState,
    value: string
  ) => {
    setRows((prev) => {
      const next = [...prev];
      (next[index] as any)[field] =
        field === "quantity" || field === "lowStockThreshold"
          ? Number(value)
          : value;
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { sku: "", variantAttributes: "{}", quantity: 0, lowStockThreshold: 0 },
    ]);
  };

  const deleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = (format: "json" | "csv") => {
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = format === "json" ? "application/json" : ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch(
          `/api/data/${shop}/inventory/import?format=${format}`,
          {
            method: "POST",
            body,
          }
        );
        const data = await res.json().catch(() => null);
        if (res.ok && Array.isArray(data)) {
          setRows(data.map(mapItemToRow));
        }
      } finally {
        input.value = "";
      }
    };
    input.click();
  };

  const handleExport = (format: "json" | "csv") => {
    window.location.href = `/api/data/${shop}/inventory/export?format=${format}`;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const toSubmit = rows.map((r) => ({
        sku: r.sku,
        variantAttributes: JSON.parse(r.variantAttributes || "{}"),
        quantity: Number(r.quantity),
        lowStockThreshold: Number(r.lowStockThreshold),
      }));
      const parsed = inventoryItemSchema.array().safeParse(toSubmit);
      if (!parsed.success) {
        setStatus("error");
        setError(parsed.error.issues.map((i) => i.message).join(", "));
        return;
      }
      setStatus("saved");
      setError(null);
      const res = await fetch(`/api/data/${shop}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setError(body.error || "Failed to save");
      }
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="file" ref={fileInputRef} className="hidden" />
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">SKU</th>
            <th className="border px-2 py-1 text-left">Variant Attributes</th>
            <th className="border px-2 py-1 text-left">Quantity</th>
            <th className="border px-2 py-1 text-left">Low Stock Threshold</th>
            <th className="border px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">
                <Input
                  aria-label="sku"
                  value={row.sku}
                  onChange={(e) => updateRow(i, "sku", e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <Input
                  aria-label="variant attributes"
                  value={row.variantAttributes}
                  onChange={(e) =>
                    updateRow(i, "variantAttributes", e.target.value)
                  }
                />
              </td>
              <td className="border px-2 py-1">
                <Input
                  aria-label="quantity"
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, "quantity", e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <Input
                  aria-label="low stock threshold"
                  type="number"
                  value={row.lowStockThreshold}
                  onChange={(e) =>
                    updateRow(i, "lowStockThreshold", e.target.value)
                  }
                />
              </td>
              <td className="border px-2 py-1 text-center">
                <Button
                  type="button"
                  variant="destructive"
                  aria-label="delete row"
                  onClick={() => deleteRow(i)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={addRow}>
          Add row
        </Button>
        <Button type="button" onClick={() => handleImport("json")}>
          Import JSON
        </Button>
        <Button type="button" onClick={() => handleImport("csv")}>
          Import CSV
        </Button>
        <Button type="button" onClick={() => handleExport("json")}>
          Export JSON
        </Button>
        <Button type="button" onClick={() => handleExport("csv")}>
          Export CSV
        </Button>
      </div>
      {status === "saved" && (
        <p className="text-sm text-green-600">Saved!</p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit">Save</Button>
    </form>
  );
}
