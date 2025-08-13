"use client";

import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";
import { inventoryItemSchema, type InventoryItem } from "@acme/types";
import { expandInventoryItem } from "@platform-core/utils/inventory";
import { FormEvent, useRef, useState } from "react";

interface Props {
  shop: string;
  initial: InventoryItem[];
}

export default function InventoryForm({ shop, initial }: Props) {
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
        item.quantity = Number(value);
      } else if (field === "lowStockThreshold") {
        item.lowStockThreshold = value === "" ? undefined : Number(value);
      } else if (field === "sku") {
        item.sku = value;
        item.productId = value;
      } else {
        // other top-level fields
        // @ts-expect-error
        item[field] = value;
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
        quantity: 0,
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
        const { [attr]: _, ...rest } = i.variantAttributes;
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
      const normalized = items.map((i) => expandInventoryItem(i));
      const parsed = inventoryItemSchema.array().safeParse(normalized);
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
            <TableRow key={idx}>
              <TableCell>
                <Input
                  value={item.sku}
                  onChange={(e) => updateItem(idx, "sku", e.target.value)}
                />
              </TableCell>
              {attributes.map((attr) => (
                <TableCell key={attr}>
                  <Input
                    value={item.variantAttributes[attr] ?? ""}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        `variantAttributes.${attr}`,
                        e.target.value
                      )
                    }
                  />
                </TableCell>
              ))}
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.lowStockThreshold ?? ""}
                  onChange={(e) =>
                    updateItem(idx, "lowStockThreshold", e.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  onClick={() => deleteRow(idx)}
                  aria-label="delete-row"
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
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

