"use client";

import React, { useMemo } from "react";

import { useTranslations } from "@acme/i18n";

import { Cluster } from "../../../atoms/primitives/Cluster";
import { Button, Input } from "../../../atoms/shadcn";
import type { GlobalItem } from "../libraryStore";

type Props = {
  globals: GlobalItem[];
  search: string;
  onSearchChange: React.Dispatch<React.SetStateAction<string>>;
  onSelect: (g: GlobalItem) => void;
};

export default function GlobalsPicker({ globals, search, onSearchChange, onSelect }: Props) {
  const t = useTranslations();
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return globals;
    return globals.filter((g) => g.label.toLowerCase().includes(q) || (g.tags || []).some((t) => t.toLowerCase().includes(q)));
  }, [globals, search]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Input
          placeholder={t("globals.searchPlaceholder") as string}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8"
        />
        <div className="text-xs text-muted-foreground">{t("globals.count", { count: filtered.length })}</div>
      </div>
      <div className="max-h-80 overflow-auto">
        {filtered.length === 0 && (
          <div className="p-2 text-muted-foreground text-sm">{t("globals.none")}</div>
        )}
        <ul className="space-y-2">
          {filtered.map((g) => (
            <li key={g.globalId} className="rounded border p-2">
              <Cluster justify="between" gap={2} className="items-center">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm">{g.label}</div>
                  {g.tags && g.tags.length > 0 && (
                    <Cluster gap={1} className="mt-1 text-xs text-muted-foreground">
                      {g.tags.map((t) => (
                        <span key={t} className="rounded border px-1">{t}</span>
                      ))}
                    </Cluster>
                  )}
                </div>
                <Button variant="outline" className="h-7 px-2" onClick={() => onSelect(g)}>{t("globals.insert")}</Button>
              </Cluster>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
