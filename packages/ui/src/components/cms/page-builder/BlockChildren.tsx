"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useCallback, useRef } from "react";
import type { PageComponent } from "@acme/types";
import { isHiddenForViewport } from "./state/layout/utils";
import GridOverlay from "./GridOverlay";
import DefaultChildrenList from "./DefaultChildrenList";
import TabbedChildren from "./TabbedChildren";
import GridAreaChildren from "./GridAreaChildren";
import type { BlockChildrenProps as Props, SlotDef } from "./BlockChildren.types";

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
  dropAllowed,
  insertParentId,
  insertIndex,
}: Props) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
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
  let slots: SlotDef[] | null = null;
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

  const handleSetContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerElRef.current = node;
    setDropRef(node);
  }, [setDropRef]);

  return (
    <SortableContext
      id={`context-${component.id}`}
      items={childIds}
      strategy={rectSortingStrategy}
    >
      <div
        ref={handleSetContainerRef}
        id={`container-${component.id}`}
        role="list"
        aria-label="Container"
        data-cy="pb-container"
        data-cy-parent-id={component.id}
        className={"border-muted relative m-2 flex flex-col gap-4 border border-dashed p-2 " + (isOver && dropAllowed === false ? "ring-2 ring-danger border-danger cursor-not-allowed" : "")}
        data-tab-titles={isTabbed && slots ? JSON.stringify(slots.map((s) => s.title)) : undefined}
      >
        {effGridEnabled && <div className="absolute inset-0"><GridOverlay gridCols={effGridCols} gutter={effGutter} /></div>}
        {/* top-of-container placeholder when targeting index 0 */}
        {isOver && insertParentId === component.id && insertIndex === 0 && (
          <div
            data-placeholder
            className={
              (dropAllowed === false
                ? "border-danger bg-danger/10 ring-2 ring-danger"
                : "border-primary bg-primary/10 ring-2 ring-primary") +
              " h-4 w-full rounded border-2 border-dashed"
            }
          />
        )}
        {!isTabbed && !isGridArea && (
          <DefaultChildrenList
            component={component}
            visibleChildren={visibleChildren}
            underlyingChildren={underlyingChildren}
            selectedIds={selectedIds}
            onSelect={onSelect}
            dispatch={dispatch}
            locale={locale}
            effGridEnabled={effGridEnabled}
            effGridCols={effGridCols}
            viewport={viewport}
            device={device}
            editor={editor}
            baselineSnap={baselineSnap}
            baselineStep={baselineStep}
            containerElRef={containerElRef}
            toUnderlyingIndex={toUnderlyingIndex}
            compType={compType}
            insertParentId={insertParentId}
            insertIndex={insertIndex}
            dropAllowed={dropAllowed}
          />
        )}
        {isTabbed && slots && (
          <TabbedChildren
            component={component}
            visibleChildren={visibleChildren}
            underlyingChildren={underlyingChildren}
            slots={slots}
            selectedIds={selectedIds}
            onSelect={onSelect}
            dispatch={dispatch}
            locale={locale}
            effGridEnabled={effGridEnabled}
            effGridCols={effGridCols}
            viewport={viewport}
            device={device}
            editor={editor}
            baselineSnap={baselineSnap}
            baselineStep={baselineStep}
            toUnderlyingIndex={toUnderlyingIndex}
            insertParentId={insertParentId}
            insertIndex={insertIndex}
            dropAllowed={dropAllowed}
          />
        )}
        {isGridArea && (
          <GridAreaChildren
            component={component}
            visibleChildren={visibleChildren}
            underlyingChildren={underlyingChildren}
            selectedIds={selectedIds}
            onSelect={onSelect}
            dispatch={dispatch}
            locale={locale}
            effGridEnabled={effGridEnabled}
            effGridCols={effGridCols}
            viewport={viewport}
            device={device}
            editor={editor}
            baselineSnap={baselineSnap}
            baselineStep={baselineStep}
            toUnderlyingIndex={toUnderlyingIndex}
            insertParentId={insertParentId}
            insertIndex={insertIndex}
            dropAllowed={dropAllowed}
          />
        )}
      </div>
    </SortableContext>
  );
}
