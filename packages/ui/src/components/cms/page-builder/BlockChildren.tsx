"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useRef } from "react";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent, HistoryState } from "@acme/types";
import { isHiddenForViewport } from "./state/layout/utils";
import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
import GridOverlay from "./GridOverlay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import { useEffect, useState } from "react";

interface Props {
  component: PageComponent;
  childComponents?: PageComponent[];
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  isOver: boolean;
  setDropRef: (node: HTMLDivElement | null) => void;
  editor?: HistoryState["editor"];
  baselineSnap?: boolean;
  baselineStep?: number;
}

export default function BlockChildren({
  component,
  childComponents,
  selectedIds,
  onSelect,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
  device,
  isOver,
  setDropRef,
  editor,
  baselineSnap = false,
  baselineStep = 8,
}: Props) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [hoverTab, setHoverTab] = useState<number | null>(null);
  useEffect(() => {
    const onStart = () => setDragActive(true);
    const onEnd = () => { setDragActive(false); setHoverTab(null); };
    window.addEventListener('pb-drag-start', onStart as any);
    window.addEventListener('pb-drag-end', onEnd as any);
    return () => {
      window.removeEventListener('pb-drag-start', onStart as any);
      window.removeEventListener('pb-drag-end', onEnd as any);
    };
  }, []);
  const underlyingChildren = (childComponents ?? []);
  let visibleChildren = underlyingChildren.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
  // Apply container stacking presets per viewport
  {
    const flags = editor?.[component.id] as any;
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const devKey = `stack${cap(viewport)}`;
    const strategy = (flags?.[devKey] as "default" | "reverse" | "custom" | undefined)
      ?? (viewport === "mobile" ? ((flags?.stackStrategy as any) ?? "default") : "default");
    if (strategy === "reverse") {
      visibleChildren = [...visibleChildren].reverse();
    } else if (strategy === "custom") {
      visibleChildren = [...visibleChildren].sort((a, b) => {
        const key = `order${cap(viewport)}` as const;
        const e = editor as any;
        const oa = (e?.[a.id]?.[key] as number | undefined);
        const ob = (e?.[b.id]?.[key] as number | undefined);
        const da = oa === undefined ? Number.POSITIVE_INFINITY : oa;
        const db = ob === undefined ? Number.POSITIVE_INFINITY : ob;
        if (da === db) return 0;
        return da < db ? -1 : 1;
      });
    }
  }
  if (visibleChildren.length === 0) return null;
  const effGridCols = Number.isFinite((component as any).gridCols) && (component as any).gridCols > 0 ? (component as any).gridCols as number : gridCols;
  const effGridEnabled = (component as any).gridSnap !== undefined ? ((component as any).gridSnap as boolean) : gridEnabled;
  const effGutter = (component as any).gridGutter as string | undefined;
  const childIds = visibleChildren.map((c) => c.id);
  const toUnderlyingIndex = (uiIndex: number): number => {
    if (uiIndex < visibleChildren.length) {
      const targetId = visibleChildren[uiIndex]?.id;
      if (targetId) {
        const idx = underlyingChildren.findIndex((c) => c.id === targetId);
        return idx >= 0 ? idx : underlyingChildren.length;
      }
    }
    return underlyingChildren.length;
  };
  const compType = (component as any).type as string;
  const isTabbed = compType === "Tabs" || compType === "TabsAccordionContainer";
  const isGridArea = compType === "Grid" && typeof (component as any).areas === 'string' && ((component as any).areas as string).trim().length > 0;

  // If tabbed container, group children by slotKey
  let slots: { key: string; title: string }[] | null = null;
  if (isTabbed) {
    const titles = ((component as any).tabs as string[] | undefined) ?? [];
    slots = (titles.length > 0 ? titles : ["Content 1", "Content 2"]).map((t, i) => ({ key: String(i), title: t }));
    // sort visibleChildren by slotKey (undefined => 0), preserving underlying order within slot
    const slotIndex = (c: PageComponent) => {
      const s = (c as any).slotKey as string | undefined;
      const num = s != null ? Number(s) : 0;
      return Number.isFinite(num) ? num : 0;
    };
    visibleChildren = [...visibleChildren].sort((a, b) => {
      const sa = slotIndex(a);
      const sb = slotIndex(b);
      if (sa === sb) return 0;
      return sa < sb ? -1 : 1;
    });
  }

  return (
    <SortableContext
      id={`context-${component.id}`}
      items={childIds}
      strategy={rectSortingStrategy}
    >
      <div
        ref={(node) => { containerElRef.current = node; setDropRef(node); }}
        id={`container-${component.id}`}
        role="list"
        aria-dropeffect="move"
        className="border-muted relative m-2 flex flex-col gap-4 border border-dashed p-2"
        data-tab-titles={isTabbed && slots ? JSON.stringify(slots.map((s) => s.title)) : undefined}
      >
        {effGridEnabled && <div className="absolute inset-0"><GridOverlay gridCols={effGridCols} gutter={effGutter} /></div>}
        {isOver && (
          <div data-placeholder className="border-primary bg-primary/10 ring-primary h-4 w-full rounded border-2 border-dashed ring-2" />
        )}
        {!isTabbed && !isGridArea && (
          <>
            {visibleChildren.map((child, i) => (
              <div key={child.id} className="relative group">
                {compType === "Grid" && (
                  <div className="absolute -top-3 left-0 z-20 flex gap-1">
                    {(() => {
                      const maxCols = Number((component as any).columns) || 12;
                      const curr = (() => {
                        const col = String(((child as any).gridColumn ?? "")).trim();
                        const m = /span\s+(\d+)/i.exec(col);
                        return m ? Math.max(1, Math.min(maxCols, parseInt(m[1]!, 10))) : 1;
                      })();
                      const setSpan = (n: number) => dispatch({ type: "update", id: child.id, patch: { gridColumn: `span ${Math.max(1, Math.min(maxCols, n))}` } as any });
                      return (
                        <>
                          <button type="button" className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black" aria-label="Decrease column span" onClick={(e) => { e.stopPropagation(); setSpan(curr - 1); }}>−</button>
                          <span className="rounded bg-black/40 px-1 text-[10px] text-white dark:bg-white/50 dark:text-black">{curr} col</span>
                          <button type="button" className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black" aria-label="Increase column span" onClick={(e) => { e.stopPropagation(); setSpan(curr + 1); }}>＋</button>
                        </>
                      );
                    })()}
                  </div>
                )}
                {compType === "Grid" && (
                  <div className="absolute -bottom-3 left-0 z-20 flex gap-1">
                    {(() => {
                      const maxRows = Math.max(1, Number((component as any).rows) || 0);
                      const curr = (() => {
                        const row = String(((child as any).gridRow ?? "")).trim();
                        const m = /span\s+(\\d+)/i.exec(row);
                        return m ? Math.max(1, parseInt(m[1]!, 10)) : 1;
                      })();
                      const setSpan = (n: number) => dispatch({ type: "update", id: child.id, patch: { gridRow: `span ${Math.max(1, maxRows ? Math.min(maxRows, n) : n)}` } as any });
                      return (
                        <>
                          <button type="button" className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black" aria-label="Decrease row span" onClick={(e) => { e.stopPropagation(); setSpan(curr - 1); }}>−</button>
                          <span className="rounded bg-black/40 px-1 text-[10px] text-white dark:bg-white/50 dark:text-black">{curr} row</span>
                          <button type="button" className="rounded bg-black/60 px-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black" aria-label="Increase row span" onClick={(e) => { e.stopPropagation(); setSpan(curr + 1); }}>＋</button>
                        </>
                      );
                    })()}
                  </div>
                )}
                {compType === "Grid" && (
                  <div
                    className="absolute top-0 bottom-0 right-0 z-20 w-1 cursor-col-resize bg-transparent"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const el = containerElRef.current;
                      const maxCols = Math.max(1, Number((component as any).columns) || 12);
                      const colWidth = el ? el.clientWidth / maxCols : 0;
                      const startX = e.clientX;
                      const parseSpan = (val: unknown) => {
                        const s = String(val ?? "").trim();
                        const m = /span\s+(\d+)/i.exec(s);
                        return m ? Math.max(1, Math.min(maxCols, parseInt(m[1]!, 10))) : 1;
                      };
                      const initial = parseSpan((child as any).gridColumn);
                      const move = (ev: PointerEvent) => {
                        const dx = ev.clientX - startX;
                        const delta = colWidth > 0 ? Math.round(dx / Math.max(1, colWidth)) : 0;
                        const next = Math.max(1, Math.min(maxCols, initial + delta));
                        // dispatch update live
                        dispatch({ type: "update", id: child.id, patch: { gridColumn: `span ${next}` } as any });
                      };
                      const up = () => {
                        try { window.removeEventListener("pointermove", move as any); } catch {}
                        try { window.removeEventListener("pointerup", up as any); } catch {}
                      };
                      window.addEventListener("pointermove", move as any);
                      window.addEventListener("pointerup", up as any, { once: true });
                    }}
                    title="Drag to change column span"
                    aria-label="Resize grid column span"
                  />
                )}
                {compType === "Grid" && (
                  <div
                    className="absolute bottom-0 left-0 right-0 z-20 h-1 cursor-row-resize bg-transparent"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const el = containerElRef.current;
                      const rowsProp = Number((component as any).rows) || 0;
                      if (!rowsProp) return; // only drag when explicit rows are set
                      const rowCount = Math.max(1, rowsProp);
                      const rowHeight = el ? el.clientHeight / rowCount : 0;
                      const startY = e.clientY;
                      const parseSpan = (val: unknown) => {
                        const s = String(val ?? "").trim();
                        const m = /span\s+(\\d+)/i.exec(s);
                        return m ? Math.max(1, Math.min(rowCount, parseInt(m[1]!, 10))) : 1;
                      };
                      const initial = parseSpan((child as any).gridRow);
                      const move = (ev: PointerEvent) => {
                        const dy = ev.clientY - startY;
                        const delta = rowHeight > 0 ? Math.round(dy / Math.max(1, rowHeight)) : 0;
                        const next = Math.max(1, Math.min(rowCount, initial + delta));
                        dispatch({ type: "update", id: child.id, patch: { gridRow: `span ${next}` } as any });
                      };
                      const up = () => {
                        try { window.removeEventListener("pointermove", move as any); } catch {}
                        try { window.removeEventListener("pointerup", up as any); } catch {}
                      };
                      window.addEventListener("pointermove", move as any);
                      window.addEventListener("pointerup", up as any, { once: true });
                    }}
                    title="Drag to change row span"
                    aria-label="Resize grid row span"
                  />
                )}
                <InlineInsert
                  index={i}
                  context="child"
                  containerType={component.type}
                  onInsert={(newComponent, index) => {
                    const insertAt = toUnderlyingIndex(index);
                    dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                  }}
                />
                <CanvasItem
                  component={child}
                  index={i}
                  parentId={component.id}
                  parentType={(component as any).type as string}
                  parentSlots={undefined}
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
                  baselineSnap={baselineSnap}
                  baselineStep={baselineStep}
                  />
              </div>
            ))}
            <InlineInsert
              index={visibleChildren.length}
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
              }}
            />
          </>
        )}

        {isTabbed && slots && dragActive && (
          <div className="sticky top-0 z-30 -mx-2 -mt-2 mb-2 flex gap-2 bg-background/80 p-2 backdrop-blur">
            {slots.map((s, i) => (
              <div
                key={`tab-head-${s.key}`}
                onMouseEnter={() => { setHoverTab(i); try { window.dispatchEvent(new CustomEvent('pb-tab-hover', { detail: { parentId: component.id, tabIndex: i } })); } catch {} }}
                onMouseLeave={() => setHoverTab((prev) => (prev === i ? null : prev))}
                className={`rounded border px-2 py-1 text-xs ${hoverTab === i ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-dashed'}`}
              >
                {s.title}
              </div>
            ))}
          </div>
        )}
        {isTabbed && slots && slots.map((slot, sIdx) => {
          const slotChildren = visibleChildren.filter((c) => {
            const sk = (c as any).slotKey as string | undefined;
            return sk === String(sIdx) || (sk == null && sIdx === 0);
          });
          const firstIdx = slotChildren.length > 0 ? visibleChildren.findIndex((c) => c.id === slotChildren[0]!.id) : visibleChildren.findIndex((c) => {
            const sk = (c as any).slotKey as string | undefined; const val = sk != null ? Number(sk) : 0; return val >= sIdx;
          });
          const startIndex = firstIdx >= 0 ? firstIdx : visibleChildren.length;
          const endIndex = slotChildren.length > 0 ? (visibleChildren.findIndex((c) => c.id === slotChildren[slotChildren.length - 1]!.id) + 1) : startIndex;
          return (
            <div key={slot.key} className="rounded border p-2">
              <div className={`mb-2 text-xs font-medium ${dragActive && hoverTab === sIdx ? 'text-primary' : 'text-muted-foreground'}`}>{slot.title}</div>
              <InlineInsert
                index={startIndex}
                context="child"
                containerType={component.type}
                onInsert={(newComponent, index) => {
                  // assign slotKey before adding
                  (newComponent as any).slotKey = String(sIdx);
                  const insertAt = toUnderlyingIndex(index);
                  dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                  try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                }}
              />
              {slotChildren.map((child) => {
                const i = visibleChildren.findIndex((c) => c.id === child.id);
                return (
                  <div key={child.id} className="relative group">
                    {/* Slot assignment control */}
                    <div className="absolute -top-3 right-0 z-20">
                      <Select
                        value={String((child as any).slotKey ?? 0)}
                        onValueChange={(v) => dispatch({ type: "update", id: child.id, patch: { slotKey: v } as any })}
                      >
                        <SelectTrigger className="h-6 w-24 px-2 py-0 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {slots!.map((s, idx2) => (
                            <SelectItem key={s.key} value={String(idx2)}>{s.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <CanvasItem
                      component={child}
                      index={i}
                      parentId={component.id}
                      parentType={(component as any).type as string}
                      parentSlots={slots!.length}
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
                    />
                    <InlineInsert
                      index={i + 1}
                      context="child"
                      containerType={component.type}
                      onInsert={(newComponent, index) => {
                        (newComponent as any).slotKey = String(sIdx);
                        const insertAt = toUnderlyingIndex(index);
                        dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                        try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                      }}
                    />
                  </div>
                );
              })}
              {/* trailing slot insert */}
              <InlineInsert
                index={endIndex}
                context="child"
                containerType={component.type}
                onInsert={(newComponent, index) => {
                  (newComponent as any).slotKey = String(sIdx);
                  const insertAt = toUnderlyingIndex(index);
                  dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                  try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                }}
              />
            </div>
          );
        })}
        {isGridArea && (() => {
          const raw = String((component as any).areas || "");
          const names = new Set<string>();
          raw
            .split(/\n+/)
            .map((line) => line.trim().replace(/^"|"$/g, ""))
            .filter(Boolean)
            .forEach((line) => {
              line.split(/\s+/).forEach((token) => { if (token && token !== ".") names.add(token); });
            });
          const gridAreas = Array.from(names.values());
          return gridAreas.map((area) => {
            const areaChildren = visibleChildren.filter((c) => (c as any).gridArea === area);
            const firstIdx = areaChildren.length > 0 ? visibleChildren.findIndex((c) => c.id === areaChildren[0]!.id) : visibleChildren.length;
            const endIndex = areaChildren.length > 0 ? (visibleChildren.findIndex((c) => c.id === areaChildren[areaChildren.length - 1]!.id) + 1) : firstIdx;
            return (
              <div key={area} className="rounded border p-2">
                <div className="text-muted-foreground mb-2 text-xs font-medium">Area: <code>{area}</code></div>
                <InlineInsert
                  index={firstIdx}
                  context="child"
                  containerType={component.type}
                  onInsert={(newComponent, index) => {
                    (newComponent as any).gridArea = area;
                    const insertAt = toUnderlyingIndex(index);
                    dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                  }}
                />
                {areaChildren.map((child) => {
                  const i = visibleChildren.findIndex((c) => c.id === child.id);
                  return (
                    <div key={child.id} className="relative group">
                      {/* Area assignment control */}
                      <div className="absolute -top-3 right-0 z-20">
                        <Select
                          value={String((child as any).gridArea ?? area)}
                          onValueChange={(v) => dispatch({ type: "update", id: child.id, patch: { gridArea: v } as any })}
                        >
                          <SelectTrigger className="h-6 w-28 px-2 py-0 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {gridAreas.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    <CanvasItem
                      component={child}
                      index={i}
                      parentId={component.id}
                      parentType={(component as any).type as string}
                      parentSlots={undefined}
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
                        baselineSnap={baselineSnap}
                        baselineStep={baselineStep}
                      />
                      <InlineInsert
                        index={i + 1}
                        context="child"
                        containerType={component.type}
                        onInsert={(newComponent, index) => {
                          (newComponent as any).gridArea = area;
                          const insertAt = toUnderlyingIndex(index);
                          dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                          try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                        }}
                      />
                    </div>
                  );
                })}
                <InlineInsert
                  index={endIndex}
                  context="child"
                  containerType={component.type}
                  onInsert={(newComponent, index) => {
                    (newComponent as any).gridArea = area;
                    const insertAt = toUnderlyingIndex(index);
                    dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
                  }}
                />
              </div>
            );
          });
        })()}
      </div>
    </SortableContext>
  );
}
