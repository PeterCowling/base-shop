"use client";

import type { ChangeEvent, RefObject } from "react";

import { Tag } from "@acme/ui/components/atoms";
import { cn } from "@acme/ui/utils/style";

import { Button } from "@/components/atoms/shadcn";

import type { InventoryStatus } from "./hooks/useInventoryEditor";

interface InventoryToolbarProps {
  status: InventoryStatus;
  error: string | null;
  onAddRow: () => void;
  onAddAttribute: () => void;
  onImport: () => void;
  onExport: (format: "json" | "csv") => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
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
  const statusColor = status === "saved" ? "success" : status === "error" ? "danger" : "default";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex flex-wrap items-center gap-2">
        <Tag color={statusColor} tone="soft" className={cn("rounded-lg border border-border-1 text-xs font-medium")}> 
          {statusLabel}
        </Tag>
        {status === "error" && error ? (
          <span className="text-sm text-danger-foreground">{error}</span>
        ) : null}
        {status === "saved" ? (
          <span className="text-sm text-success-foreground">The latest changes are safe.</span>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          color="success"
          tone="solid"
          type="button"
          onClick={onAddRow}
          className="h-9 rounded-lg px-3 text-xs font-semibold shadow-elevation-1"
        >
          Add row
        </Button>
        <Button
          type="button"
          color="primary"
          tone="outline"
          className="h-9 rounded-lg px-3 text-xs"
          onClick={onAddAttribute}
        >
          Add attribute
        </Button>
        <Button
          type="button"
          color="primary"
          tone="ghost"
          className="h-9 rounded-lg text-xs"
          onClick={onImport}
        >
          Import JSON/CSV
        </Button>
        <Button
          type="button"
          color="primary"
          tone="ghost"
          className="h-9 rounded-lg text-xs"
          onClick={() => onExport("json")}
        >
          Export JSON
        </Button>
        <Button
          type="button"
          color="primary"
          tone="ghost"
          className="h-9 rounded-lg text-xs"
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
