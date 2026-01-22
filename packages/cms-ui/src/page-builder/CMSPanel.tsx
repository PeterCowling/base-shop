"use client";

import React, { useMemo, useState } from "react";

import { OverlayScrim } from "@acme/design-system/primitives";
import { Drawer, DrawerContent, DrawerDescription, DrawerPortal,DrawerTitle } from "@acme/design-system/primitives/drawer";
import { Button, Input } from "@acme/design-system/shadcn";
import type { PageComponent } from "@acme/types";

// i18n-exempt — editor-only panel; copy pending i18n wiring
/* i18n-exempt */
const t = (s: string) => s;

function flatten(list: PageComponent[]): PageComponent[] {
  const out: PageComponent[] = [];
  const walk = (nodes: PageComponent[]) => {
    for (const n of nodes) {
      out.push(n);
      const maybeKids = (n as Record<string, unknown>).children;
      if (Array.isArray(maybeKids)) walk(maybeKids as PageComponent[]);
    }
  };
  walk(list);
  return out;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
}

export default function CMSPanel({ open, onOpenChange, components, selectedIds: _selectedIds, onSelectIds }: Props) {
  const [q, setQ] = useState("");
  const all = useMemo(() => flatten(components), [components]);
  const datasets = useMemo(() => all.filter((c) => c.type === "Dataset"), [all]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return datasets;
    return datasets.filter((d) => {
      const nameProp = (d as Record<string, unknown>).name;
      const name = (typeof nameProp === "string" ? nameProp : d.id || d.type).toString().toLowerCase();
      const rawDs = (d as Record<string, unknown>).dataset as Record<string, unknown> | undefined;
      const srcVal = rawDs && typeof rawDs.source === "string" ? rawDs.source : "";
      const src = srcVal.toString().toLowerCase();
      return name.includes(query) || src.includes(query);
    });
  }, [datasets, q]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="right" width="w-96" className="flex h-full flex-col p-0">
          <div className="px-4 py-3">
            {/* i18n-exempt */}
            <DrawerTitle>{t("CMS Connections")}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {t("Browse datasets on the current page and connect them to components.")}
            </DrawerDescription>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-3 text-sm">
            {/* i18n-exempt */}
            <Input placeholder={t("Search datasets…")} value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="text-xs text-muted-foreground">{t(`${filtered.length} dataset${filtered.length === 1 ? "" : "s"}`)}</div>
            <div className="flex-1 overflow-auto">
              {filtered.length === 0 && (
                // i18n-exempt — editor-only hint
                /* i18n-exempt */
                <div className="p-2 text-muted-foreground">{t("No datasets on this page. Insert a Dataset block to connect elements.")}</div>
              )}
              <ul className="space-y-2">
                {filtered.map((d) => {
                  const raw = (d as Record<string, unknown>).dataset as Record<string, unknown> | undefined;
                  const cfg = {
                    source: raw && typeof raw.source === "string" ? raw.source : undefined,
                    mode: raw && typeof raw.mode === "string" ? raw.mode : undefined,
                    maxItems: raw && typeof raw.maxItems === "number" ? raw.maxItems : undefined,
                  } as { source?: string; mode?: string; maxItems?: number };
                  return (
                    <li key={d.id} className="rounded border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{typeof (d as Record<string, unknown>).name === "string" ? (d as Record<string, unknown>).name as string : d.type}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {/* i18n-exempt */}
                            {t("Source:")} {cfg.source || "—"}
                            {/* i18n-exempt */}
                            {" · "}
                            {/* i18n-exempt */}
                            {t("Mode:")} {cfg.mode || "read"}
                            {/* i18n-exempt */}
                            {" · "}
                            {/* i18n-exempt */}
                            {t("Max items:")} {cfg.maxItems ?? "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* i18n-exempt */}
                          <Button variant="outline" className="h-7 px-2" onClick={() => onSelectIds([d.id])}>{t("Select")}</Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-xs text-muted-foreground">
              {/* i18n-exempt */}
              {t("Tip: Select a Dataset block, then use the Inspector → CMS tab to configure connections and filters.")}
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
