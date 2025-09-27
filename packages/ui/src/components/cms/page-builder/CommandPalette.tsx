"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, Input, Button } from "../../atoms/shadcn";
import { Grid } from "../../atoms/primitives";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { defaults, CONTAINER_TYPES, type ComponentType } from "./defaults";
import { canDropChild, getAllowedChildren, isTopLevelAllowed, type ParentKind } from "./rules";
import type { Action } from "./state/layout/types";
import { atomRegistry, moleculeRegistry, organismRegistry, containerRegistry, layoutRegistry } from "../blocks";

// i18n-exempt — internal builder tool; copy is minimal and non-user-facing
/* i18n-exempt */
const t = (s: string) => s;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  components: PageComponent[];
  selectedIds: string[];
  dispatch: React.Dispatch<Action>;
  onSelectIds?: (ids: string[]) => void;
};

type PaletteEntry = { type: ComponentType; label: string; category: string; icon?: string };

// Build palette entries by introspecting registries similar to InlineInsert
function usePalette(): PaletteEntry[] {
  const registries: Array<[
    string,
    Record<string, { previewImage?: string }>
  ]> = [];
  registries.push(["layout", layoutRegistry]);
  registries.push(["containers", containerRegistry]);
  registries.push(["atoms", atomRegistry]);
  registries.push(["molecules", moleculeRegistry]);
  registries.push(["organisms", organismRegistry]);
  const out: PaletteEntry[] = [];
  registries.forEach(([category, reg]) => {
    Object.keys(reg || {})
      .sort()
      .forEach((t) => {
        const type = t as ComponentType;
        const label = t.replace(/([A-Z])/g, " $1").trim();
        const icon = reg[t]?.previewImage as string | undefined;
        out.push({ type, label, category, icon });
      });
  });
  return out;
}

function findParentInfo(
  list: PageComponent[],
  id: string,
  parentId?: string
): { parentId?: string; index: number } | null {
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.id === id) return { parentId, index: i };
    const kids = (c as Partial<PageComponent>).children as PageComponent[] | undefined;
    if (Array.isArray(kids)) {
      const found = findParentInfo(kids, id, c.id);
      if (found) return found;
    }
  }
  return null;
}

export default function CommandPalette({ open, onOpenChange, components, selectedIds, dispatch, onSelectIds }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const all = usePalette();
  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? all.filter((i) => i.label.toLowerCase().includes(query) || i.type.toLowerCase().includes(query))
      : all;
    // Filter by placement (top-level vs inside parent) based on current selection parent
    if (selectedIds.length === 0) {
      return base.filter((i) => isTopLevelAllowed(i.type));
    }
    const info = findParentInfo(components, selectedIds[0]!);
    if (!info || !info.parentId) return base.filter((i) => isTopLevelAllowed(i.type));
    const parent = (() => {
      const stack: PageComponent[] = [...components];
      while (stack.length) {
        const n = stack.shift()!;
        if (n.id === info.parentId) return n;
        if (Array.isArray((n as Partial<PageComponent>).children))
          stack.unshift(...(((n as Partial<PageComponent>).children as PageComponent[]) ?? []));
      }
      return null as PageComponent | null;
    })();
    if (!parent) return base;
    const allowed = getAllowedChildren(parent.type as ComponentType);
    return base.filter((e) => allowed.has(e.type));
  }, [q, all, components, selectedIds]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQ("");
  }, [open]);

  const insert = (type: ComponentType) => {
    const isContainer = CONTAINER_TYPES.includes(type);
    const component = {
      id: ulid(),
      type,
      ...(defaults[type] ?? {}),
      ...(isContainer ? { children: [] } : {}),
    } as PageComponent;
    let parentId: string | undefined = undefined;
    let index = components.length;
    if (selectedIds.length > 0) {
      const info = findParentInfo(components, selectedIds[0]!);
      if (info) {
        parentId = info.parentId;
        index = info.index + 1;
      }
    }
    const parentType = (() => {
      if (!parentId) return "ROOT" as ParentKind;
      const stack: PageComponent[] = [...components];
      while (stack.length) {
        const n = stack.shift()!;
        if (n.id === parentId) return n.type as ComponentType;
        if (Array.isArray((n as Partial<PageComponent>).children))
          stack.unshift(...(((n as Partial<PageComponent>).children as PageComponent[]) ?? []));
      }
      return "ROOT" as ParentKind;
    })();
    const ok = parentId ? canDropChild(parentType, type) : isTopLevelAllowed(type);
    if (!ok) {
      try {
        window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t(`Cannot place ${type} here`) }));
      } catch {}
      return;
    }
    dispatch({ type: "add", component, parentId, index });
    try { onSelectIds?.([component.id]); } catch {}
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full">
        <DialogTitle>{t("Insert…")}</DialogTitle>
        <div className="space-y-2">
          <Input
            ref={inputRef}
            /* i18n-exempt */
            placeholder={t("Search components")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="max-h-64 overflow-auto">
            {items.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">{t("No results")}</div>
            ) : (
              <Grid cols={1} gap={1} className="">
                {items.map((i) => (
                  <Button
                    key={`${i.category}-${i.type}`}
                    variant="outline"
                    className="justify-start"
                    onClick={() => insert(i.type)}
                  >
                    <span className="me-2 rounded border bg-muted px-1 text-xs capitalize">{i.category}</span>
                    {i.label}
                  </Button>
                ))}
              </Grid>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{t("Enter to insert • Esc to close")}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
