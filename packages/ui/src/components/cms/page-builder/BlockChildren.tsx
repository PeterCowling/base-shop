"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent, HistoryState } from "@acme/types";
import { isHiddenForViewport } from "./state/layout/utils";
import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
import GridOverlay from "./GridOverlay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";

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
}: Props) {
  const underlyingChildren = (childComponents ?? []);
  let visibleChildren = underlyingChildren.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
  // Apply container stacking presets for mobile
  if (viewport === "mobile") {
    const strategy = (editor?.[component.id]?.stackStrategy as "default" | "reverse" | "custom" | undefined) ?? "default";
    if (strategy === "reverse") {
      visibleChildren = [...visibleChildren].reverse();
    } else if (strategy === "custom") {
      visibleChildren = [...visibleChildren].sort((a, b) => {
        const oa = (editor?.[a.id]?.orderMobile as number | undefined);
        const ob = (editor?.[b.id]?.orderMobile as number | undefined);
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
      <div ref={setDropRef} id={`container-${component.id}`} role="list" aria-dropeffect="move" className="border-muted relative m-2 flex flex-col gap-4 border border-dashed p-2">
        {effGridEnabled && <div className="absolute inset-0"><GridOverlay gridCols={effGridCols} gutter={effGutter} /></div>}
        {isOver && (
          <div data-placeholder className="border-primary bg-primary/10 ring-primary h-4 w-full rounded border-2 border-dashed ring-2" />
        )}
        {!isTabbed && !isGridArea && (
          <>
            {visibleChildren.map((child, i) => (
              <div key={child.id} className="relative group">
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
              <div className="text-muted-foreground mb-2 text-xs font-medium">{slot.title}</div>
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
