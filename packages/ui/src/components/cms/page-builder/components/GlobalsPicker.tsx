"use client";

import React, { useMemo } from "react";
import { Button, Input } from "../../../atoms/shadcn";
import type { GlobalItem } from "../libraryStore";

type Props = {
  globals: GlobalItem[];
  search: string;
  onSearchChange: React.Dispatch<React.SetStateAction<string>>;
  onSelect: (g: GlobalItem) => void;
};

export default function GlobalsPicker({ globals, search, onSearchChange, onSelect }: Props) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return globals;
    return globals.filter((g) => g.label.toLowerCase().includes(q) || (g.tags || []).some((t) => t.toLowerCase().includes(q)));
  }, [globals, search]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Input
          placeholder="Search globals…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8"
        />
        <div className="text-xs text-muted-foreground">{filtered.length} item{filtered.length === 1 ? "" : "s"}</div>
      </div>
      <div className="max-h-80 overflow-auto">
        {filtered.length === 0 && (
          <div className="p-2 text-muted-foreground text-sm">No matching globals.</div>
        )}
        <ul className="space-y-2">
          {filtered.map((g) => (
            <li key={g.globalId} className="rounded border p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm">{g.label}</div>
                  {g.tags && g.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {g.tags.map((t) => (
                        <span key={t} className="rounded border px-1">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" className="h-7 px-2" onClick={() => onSelect(g)}>Insert</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

