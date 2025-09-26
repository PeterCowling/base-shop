"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerPortal } from "../../atoms/primitives/drawer";
import { Button, Input } from "../../atoms/shadcn";
import { OverlayScrim } from "../../atoms";
import type { PageComponent } from "@acme/types";

function flatten(list: PageComponent[]): PageComponent[] {
  const out: PageComponent[] = [];
  const walk = (nodes: PageComponent[]) => {
    for (const n of nodes) {
      out.push(n);
      const kids = (n as any).children as PageComponent[] | undefined;
      if (Array.isArray(kids)) walk(kids);
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

export default function CMSPanel({ open, onOpenChange, components, selectedIds, onSelectIds }: Props) {
  const [q, setQ] = useState("");
  const all = useMemo(() => flatten(components), [components]);
  const datasets = useMemo(() => all.filter((c) => String((c as any).type) === "Dataset"), [all]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return datasets;
    return datasets.filter((d) => {
      const name = ((d as any).name || d.id || d.type).toString().toLowerCase();
      const src = (((d as any).dataset as any)?.source || "").toString().toLowerCase();
      return name.includes(query) || src.includes(query);
    });
  }, [datasets, q]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="right" width="w-[24rem]" className="z-[60] p-0">
        <div className="px-4 py-3">
          <DrawerTitle>CMS Connections</DrawerTitle>
        </div>
        <div className="flex h-[calc(100%-3rem)] flex-col gap-3 p-3 text-sm">
          <Input placeholder="Search datasets…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="text-xs text-muted-foreground">{filtered.length} dataset{filtered.length === 1 ? "" : "s"}</div>
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-muted-foreground">No datasets on this page. Insert a Dataset block to connect elements.</div>
            )}
            <ul className="space-y-2">
              {filtered.map((d) => {
                const cfg = (d as any).dataset || {};
                return (
                  <li key={d.id} className="rounded border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{(d as any).name || d.type}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          Source: {cfg.source || "—"} · Mode: {cfg.mode || "read"} · Max items: {cfg.maxItems ?? "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" className="h-7 px-2" onClick={() => onSelectIds([d.id])}>Select</Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="text-xs text-muted-foreground">
            Tip: Select a Dataset block, then use the Inspector → CMS tab to configure connections and filters.
          </div>
        </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
