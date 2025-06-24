// packages/ui/components/cms/ProductFilters.tsx  (unchanged except export)
"use client";
import { ChangeEvent } from "react";

export const statuses = ["all", "active", "draft", "archived"] as const;

interface Props {
  search: string;
  status: string;
  onSearchChange(v: string): void;
  onStatusChange(v: string): void;
}

export default function ProductFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        placeholder="Search by title or SKU…"
        className="w-64 rounded-md border px-3 py-2 text-sm"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="rounded-md border px-3 py-2 text-sm"
        value={status}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onStatusChange(e.target.value)
        }
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? "All statuses" : s}
          </option>
        ))}
      </select>
    </div>
  );
}
