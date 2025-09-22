"use client";

import type { PageComponent, HistoryState } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
import type { SlotDef } from "./BlockChildren.types";
import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";

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
}: Props) {
  // Track dragging to show sticky tab headers
  const [dragActive, setDragActive] = useState(false);
  const [hoverTab, setHoverTab] = useState<number | null>(null);
  useEffect(() => {
    const onStart = () => setDragActive(true);
    const onEnd = () => {
      setDragActive(false);
      setHoverTab(null);
    };
    window.addEventListener("pb-drag-start", onStart as any);
    window.addEventListener("pb-drag-end", onEnd as any);
    return () => {
      window.removeEventListener("pb-drag-start", onStart as any);
      window.removeEventListener("pb-drag-end", onEnd as any);
    };
  }, []);

  return (
    <>
      {dragActive && (
        <div className="sticky top-0 z-30 -mx-2 -mt-2 mb-2 flex gap-2 bg-background/80 p-2 backdrop-blur">
          {slots.map((s, i) => (
            <div
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
              className={`rounded border px-2 py-1 text-xs ${hoverTab === i ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-dashed"}`}
            >
              {s.title}
            </div>
          ))}
        </div>
      )}

      {slots.map((slot, sIdx) => {
        const slotChildren = visibleChildren.filter((c) => {
          const sk = (c as any).slotKey as string | undefined;
          return sk === String(sIdx) || (sk == null && sIdx === 0);
        });
        const firstIdx =
          slotChildren.length > 0
            ? visibleChildren.findIndex((c) => c.id === slotChildren[0]!.id)
            : visibleChildren.findIndex((c) => {
                const sk = (c as any).slotKey as string | undefined;
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
                (newComponent as any).slotKey = String(sIdx);
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === startIndex && (
              <div
                data-placeholder
                className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"}
              />
            )}
            {slotChildren.map((child) => {
              const i = visibleChildren.findIndex((c) => c.id === child.id);
              return (
                <div key={child.id} className="relative group">
                  {insertParentId === component.id && insertIndex === i && (
                    <div data-placeholder className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"} />
                  )}
                  <div className="absolute -top-3 -left-[10px] z-20">
                    <Select
                      value={String((child as any).slotKey ?? 0)}
                      onValueChange={(v) => dispatch({ type: "update", id: child.id, patch: { slotKey: v } as any })}
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
                    parentType={(component as any).type as string}
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
                  />
                  <InlineInsert
                    index={i + 1}
                    context="child"
                    containerType={component.type}
                    onInsert={(newComponent, index) => {
                      (newComponent as any).slotKey = String(sIdx);
                      const insertAt = toUnderlyingIndex(index);
                      dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                      try {
                        window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
                      } catch {}
                    }}
                  />
                  {insertParentId === component.id && insertIndex === i + 1 && (
                    <div data-placeholder className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"} />
                  )}
                </div>
              );
            })}
            <InlineInsert
              index={endIndex}
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                (newComponent as any).slotKey = String(sIdx);
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === endIndex && (
              <div data-placeholder className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"} />
            )}
          </div>
        );
      })}
    </>
  );
}
