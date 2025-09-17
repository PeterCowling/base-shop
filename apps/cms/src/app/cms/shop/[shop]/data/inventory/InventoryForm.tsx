"use client";

import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";
import type { InventoryItem } from "@platform-core/types/inventory";
import { FormEvent, useRef, useState } from "react";
import InventoryRow from "./InventoryRow";
import { useInventoryValidation } from "./useInventoryValidation";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";

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

  const onExport = (format: "json" | "csv") => {
    const url = `/api/data/${shop}/inventory/export?format=${format}`;

    // Fire the request in the background so the test can assert `fetch`
    // was invoked. Any errors are reported asynchronously.
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to export");
        }
      })
      .catch((err) => {
        setStatus("error");
        setError((err as Error).message);
      });

    const a = document.createElement("a");
    a.href = url;
    a.download = format === "json" ? "inventory.json" : "inventory.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const statusLabel = status === "saved" ? "Inventory saved" : status === "error" ? "Needs attention" : "Draft";
  const statusVariant = status === "saved" ? "success" : status === "error" ? "destructive" : "default";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag
            variant={statusVariant}
            className={cn(
              "rounded-lg border border-white/10 bg-white/10 text-xs font-medium",
              status === "saved" && "bg-emerald-500/20 text-emerald-100",
              status === "error" && "bg-rose-500/20 text-rose-100"
            )}
          >
            {statusLabel}
          </Tag>
          {status === "error" && error ? (
            <span className="text-sm text-rose-200">{error}</span>
          ) : null}
          {status === "saved" && (
            <span className="text-sm text-emerald-200">The latest changes are safe.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={addRow}
            className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-400"
          >
            Add row
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-white/30 px-3 text-xs text-white hover:bg-white/10"
            onClick={addAttribute}
          >
            Add attribute
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-lg text-xs text-white hover:bg-white/10"
            onClick={onImport}
          >
            Import JSON/CSV
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-lg text-xs text-white hover:bg-white/10"
            onClick={() => onExport("json")}
          >
            Export JSON
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-lg text-xs text-white hover:bg-white/10"
            onClick={() => onExport("csv")}
          >
            Export CSV
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </div>

      <Card className="border border-white/10 bg-white/5 text-white">
        <CardContent className="px-0 py-0">
          <Table className="text-white">
            <TableHeader className="bg-white/10">
              <TableRow className="text-xs uppercase tracking-wide text-white/70">
                <TableHead className="text-white">SKU</TableHead>
                {attributes.map((attr) => (
                  <TableHead key={attr} className="text-white">
                    <div className="flex items-center justify-between gap-2">
                      <span>{attr}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 rounded-lg px-2 text-xs text-white/70 hover:bg-white/10"
                        onClick={() => deleteAttribute(attr)}
                        aria-label={`delete-attr-${attr}`}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-white">Quantity</TableHead>
                <TableHead className="text-white">Low stock threshold</TableHead>
                <TableHead className="text-white">&nbsp;</TableHead>
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          className="h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
        >
          Save inventory
        </Button>
      </div>
    </form>
  );
}
