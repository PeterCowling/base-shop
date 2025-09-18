"use client";

import { Button } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";
import type { ChangeEvent, RefObject } from "react";
import type { InventoryStatus } from "./hooks/useInventoryEditor";

interface InventoryToolbarProps {
  status: InventoryStatus;
  error: string | null;
  onAddRow: () => void;
  onAddAttribute: () => void;
  onImport: () => void;
  onExport: (format: "json" | "csv") => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function InventoryToolbar({
  status,
  error,
  onAddRow,
  onAddAttribute,
  onImport,
  onExport,
  fileInputRef,
  onFileChange,
}: InventoryToolbarProps) {
  const statusLabel =
    status === "saved"
      ? "Inventory saved"
      : status === "error"
      ? "Needs attention"
      : "Draft";
  const statusVariant =
    status === "saved"
      ? "success"
      : status === "error"
      ? "destructive"
      : "default";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tag
          variant={statusVariant}
          className={cn(
            "rounded-lg border border-white/10 bg-white/10 text-xs font-medium",
            status === "saved" && "bg-emerald-500/20 text-emerald-100",
            status === "error" && "bg-rose-500/20 text-rose-100",
          )}
        >
          {statusLabel}
        </Tag>
        {status === "error" && error ? (
          <span className="text-sm text-rose-200">{error}</span>
        ) : null}
        {status === "saved" ? (
          <span className="text-sm text-emerald-200">The latest changes are safe.</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={onAddRow}
          className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-400"
        >
          Add row
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg border-white/30 px-3 text-xs text-white hover:bg-white/10"
          onClick={onAddAttribute}
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
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
