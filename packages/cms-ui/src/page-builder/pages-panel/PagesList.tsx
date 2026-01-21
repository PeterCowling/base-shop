"use client";
import React from "react";

import { useTranslations } from "@acme/i18n";

import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Button, Input } from "@acme/design-system/shadcn";

import { PagesListItem } from "./PagesListItem";
import type { PageItem } from "./types";

export function PagesList({
  query,
  setQuery,
  filtered,
  selectedId,
  onSelect,
  onMove,
  onToggleVisibility,
  onAdd,
  orderDirty,
  onSaveOrder,
  onSaveDraft,
}: {
  query: string;
  setQuery: (q: string) => void;
  filtered: PageItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggleVisibility: (page: PageItem) => void;
  onAdd: () => void;
  orderDirty: boolean;
  onSaveOrder: () => void;
  onSaveDraft: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex h-full flex-col gap-2 border-r p-3 text-sm">
      <div className="flex items-center gap-2">
        <Input placeholder={String(t("pb.pagesPanel.searchPlaceholder"))} value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
        <Button variant="outline" className="h-8 px-2" onClick={onAdd}>{t("actions.add")}</Button>
      </div>
      <div className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? t("pb.noun.page") : t("pb.noun.pages")}</div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 && (
          <div className="p-2 text-muted-foreground">{t("pb.pagesPanel.noneYet")}</div>
        )}
        <ul className="space-y-2">
          {filtered.map((p) => (
            <PagesListItem
              key={p.id}
              page={p}
              isSelected={p.id === selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </ul>
      </div>
      <Cluster justify="between" alignY="center" gap={2}>
        <div className="text-xs text-muted-foreground">{t("pb.pagesPanel.reorderHint")}</div>
        <Cluster alignY="center" gap={2}>
          <Button variant="outline" className="h-8 px-2" onClick={onSaveOrder} disabled={!orderDirty}>
            {orderDirty ? t("pb.pagesPanel.saveOrder") : t("pb.pagesPanel.orderSaved")}
          </Button>
          <Button variant="outline" className="h-8 px-2" onClick={onSaveDraft}>{t("pb.pagesPanel.saveDraft")}</Button>
        </Cluster>
      </Cluster>
    </div>
  );
}
