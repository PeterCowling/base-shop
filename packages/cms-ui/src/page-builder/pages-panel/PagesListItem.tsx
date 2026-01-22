"use client";
import React from "react";

import { Button } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

import type { PageItem } from "./types";

export function PagesListItem({
  page,
  isSelected,
  onSelect,
  onMove,
  onToggleVisibility,
}: {
  page: PageItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggleVisibility: (page: PageItem) => void;
}) {
  const p = page;
  const t = useTranslations();
  // i18n-exempt -- TECH-000 [ttl=2025-10-28] constant used for visual URL path separator; not user-facing copy
  const PATH_SEP = "/" as const;
  return (
    <>
      {/* i18n-exempt -- TECH-000 [ttl=2025-10-28] Tailwind utility classes in className are not user-facing copy */}
      <li key={p.id} className={`rounded border ${isSelected ? "ring-1 ring-primary" : ""}`}>
      <button type="button" className="block w-full truncate px-2 py-1 min-h-10 min-w-10 text-start" onClick={() => onSelect(p.id)}>
        {/* i18n-exempt: Admin-only CMS panel shows stored page title/slug */}
        <div className="truncate font-medium">{p.title || p.seo?.title?.en || p.slug || p.id}</div>
        <div className="truncate text-xs text-muted-foreground">
          {PATH_SEP}
          {p.slug}
        </div>
      </button>
      <div className="flex items-center justify-between gap-2 border-t px-2 py-1 text-xs">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="min-h-10 min-w-10 px-2"
            onClick={() => onMove(p.id, -1)}
            aria-label={t("pb.pagesPanel.moveUpAria") as unknown as string}
          >
            {/* i18n-exempt: using arrow as icon, aria-label localized */}
            <span aria-hidden>↑</span>
          </Button>
          <Button
            variant="outline"
            className="min-h-10 min-w-10 px-2"
            onClick={() => onMove(p.id, +1)}
            aria-label={t("pb.pagesPanel.moveDownAria") as unknown as string}
          >
            {/* i18n-exempt: using arrow as icon, aria-label localized */}
            <span aria-hidden>↓</span>
          </Button>
          <Button
            variant="outline"
            className="min-h-10 px-2"
            onClick={() => onToggleVisibility(p)}
          >
            {p.visibility === "hidden" ? t("cms.builder.layer.show") : t("cms.builder.layer.hide")}
          </Button>
        </div>
        <div>
          <Button variant="outline" className="min-h-10 px-2" onClick={() => onSelect(p.id)}>
            {t("cms.breadcrumb.settings")}
          </Button>
        </div>
      </div>
      </li>
    </>
  );
}
