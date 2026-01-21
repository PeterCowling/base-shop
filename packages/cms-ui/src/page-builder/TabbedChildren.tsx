"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/types";

import type { DevicePreset } from "@acme/ui/utils/devicePresets";
import { cn } from "@acme/design-system/utils/style/cn";
import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";

import type { SlotDef } from "./BlockChildren.types";
import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import type { Action } from "./state";

type Props = {
  component: PageComponent;
  visibleChildren: PageComponent[];
  underlyingChildren: PageComponent[];
  slots: SlotDef[];
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  effGridEnabled: boolean;
  effGridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  editor?: HistoryState["editor"];
  baselineSnap: boolean;
  baselineStep: number;
  toUnderlyingIndex: (uiIndex: number) => number;
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  dropAllowed?: boolean | null;
  preferParentOnClick?: boolean;
};

export default function TabbedChildren({
  component,
  visibleChildren,
  underlyingChildren: _underlyingChildren,
  slots,
  selectedIds,
  onSelect,
  dispatch,
  locale,
  effGridEnabled,
  effGridCols,
  viewport,
  device,
  editor,
  baselineSnap: _baselineSnap,
  baselineStep: _baselineStep,
  toUnderlyingIndex,
  insertParentId,
  insertIndex,
  dropAllowed,
  preferParentOnClick = false,
}: Props) {
  const t = useTranslations();
  // Track dragging to show sticky tab headers
  const [dragActive, setDragActive] = useState(false);
  const [hoverTab, setHoverTab] = useState<number | null>(null);
  useEffect(() => {
    const onStart: EventListener = () => setDragActive(true);
    const onEnd: EventListener = () => {
      setDragActive(false);
      setHoverTab(null);
    };
    window.addEventListener("pb-drag-start", onStart);
    window.addEventListener("pb-drag-end", onEnd);
    return () => {
      window.removeEventListener("pb-drag-start", onStart);
      window.removeEventListener("pb-drag-end", onEnd);
    };
  }, []);

  return (
    <>
      {dragActive && (
        <Cluster
          gap={2}
          wrap
          className="sticky top-0 mb-2 bg-background/80 p-2 backdrop-blur"
        >
          {slots.map((s, i) => (
            <button
              type="button"
              key={`tab-head-${s.key}`}
              onMouseEnter={() => {
                setHoverTab(i);
                try {
                  window.dispatchEvent(
                    new CustomEvent("pb-tab-hover", { detail: { parentId: component.id, tabIndex: i } })
                  );
                } catch {}
              }}
              onMouseLeave={() => setHoverTab((prev) => (prev === i ? null : prev))}
              onFocus={() => setHoverTab(i)}
              onBlur={() => setHoverTab((prev) => (prev === i ? null : prev))}
              aria-pressed={hoverTab === i}
              className={cn(
                "rounded border px-2 py-1 text-xs", // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                hoverTab === i ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-dashed" // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
              )}
            >
              {s.title}
            </button>
          ))}
        </Cluster>
      )}

      {slots.map((slot, sIdx) => {
        type PageComponentWithSlot = PageComponent & { slotKey?: string };
        const slotChildren = visibleChildren.filter((c) => {
          const sk = (c as PageComponentWithSlot).slotKey;
          return sk === String(sIdx) || (sk == null && sIdx === 0);
        });
        const firstIdx =
          slotChildren.length > 0
            ? visibleChildren.findIndex((c) => c.id === slotChildren[0]!.id)
            : visibleChildren.findIndex((c) => {
                const sk = (c as PageComponentWithSlot).slotKey;
                const val = sk != null ? Number(sk) : 0;
                return val >= sIdx;
              });
        const startIndex = firstIdx >= 0 ? firstIdx : visibleChildren.length;
        const endIndex =
          slotChildren.length > 0
            ? visibleChildren.findIndex((c) => c.id === slotChildren[slotChildren.length - 1]!.id) + 1
            : startIndex;
        return (
          <div key={slot.key} className="rounded border p-2">
            <div className={`mb-2 text-xs font-medium ${dragActive && hoverTab === sIdx ? "text-primary" : "text-muted-foreground"}`}>
              {slot.title}
            </div>
            <InlineInsert
              index={startIndex}
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                (newComponent as (PageComponent & { slotKey?: string })).slotKey = String(sIdx);
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === startIndex && (
              <div
                data-placeholder
                className={cn(
                  "mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                  dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary" // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                )}
              />
            )}
            {slotChildren.map((child) => {
              const i = visibleChildren.findIndex((c) => c.id === child.id);
              return (
                <div key={child.id} className="relative group">
                  {insertParentId === component.id && insertIndex === i && (
                    <div
                      data-placeholder
                      className={cn(
                        "mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                        dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary" // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                      )}
                    />
                  )}
                  <div className="absolute -top-3 -start-2.5">
                    <Select
                      value={String((child as PageComponentWithSlot).slotKey ?? 0)}
                      onValueChange={(v) =>
                        dispatch({
                          type: "update",
                          id: child.id,
                          patch: { slotKey: v } as Partial<PageComponentWithSlot>,
                        })
                      }
                    >
                      <SelectTrigger className="h-6 w-24 px-2 py-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((s, idx2) => (
                          <SelectItem key={s.key} value={String(idx2)}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CanvasItem
                    component={child}
                    index={i}
                    parentId={component.id}
                    parentType={component.type as string}
                    parentSlots={slots.length}
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                    onRemove={() => dispatch({ type: "remove", id: child.id })}
                    dispatch={dispatch}
                    locale={locale}
                    gridEnabled={effGridEnabled}
                    gridCols={effGridCols}
                    viewport={viewport}
                    device={device}
                    editor={editor}
                    insertParentId={insertParentId}
                    insertIndex={insertIndex}
                    dropAllowed={dropAllowed}
                    preferParentOnClick={preferParentOnClick}
                  />
                  <InlineInsert
                    index={i + 1}
                    context="child"
                    containerType={component.type}
                    onInsert={(newComponent, index) => {
                      (newComponent as PageComponentWithSlot).slotKey = String(sIdx);
                      const insertAt = toUnderlyingIndex(index);
                      dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                      try {
                        window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                      } catch {}
                    }}
                  />
                  {insertParentId === component.id && insertIndex === i + 1 && (
                    <div
                      data-placeholder
                      className={cn(
                        "mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                        dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary" // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                      )}
                    />
                  )}
                </div>
              );
            })}
            <InlineInsert
              index={endIndex}
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                (newComponent as PageComponentWithSlot).slotKey = String(sIdx);
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === endIndex && (
              <div
                data-placeholder
                className={cn(
                  "mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                  dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary" // i18n-exempt -- CMS-1010 class names [ttl=2025-12-31]
                )}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
