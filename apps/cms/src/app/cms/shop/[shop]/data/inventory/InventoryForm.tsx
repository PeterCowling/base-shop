"use client";

import { Button, Textarea } from "@/components/atoms/shadcn";
import { inventoryItemSchema, type InventoryItem } from "@types";
import { FormEvent, useRef, useState } from "react";

interface Props {
  shop: string;
  initial: InventoryItem[];
}

export default function InventoryForm({ shop, initial }: Props) {
  const [text, setText] = useState(
    () => JSON.stringify(initial, null, 2)
  );
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const json = JSON.parse(text);
      const parsed = inventoryItemSchema.array().safeParse(json);
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
      setText(JSON.stringify(body.items, null, 2));
      setStatus("saved");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onExport = async () => {
    try {
      const res = await fetch(`/api/data/${shop}/inventory/export?format=json`);
      if (!res.ok) {
        throw new Error("Failed to export");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers
        .get("content-type")
        ?.includes("json")
        ? "inventory.json"
        : "inventory.csv";
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
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
      />
      {status === "saved" && (
        <p className="text-sm text-green-600">Saved!</p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="space-x-2">
        <Button type="submit">Save</Button>
        <Button type="button" onClick={onImport}>
          Import
        </Button>
        <Button type="button" onClick={onExport}>
          Export
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
