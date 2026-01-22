"use client";

import { useCallback, useRef } from "react";
import { rectSortingStrategy,SortableContext } from "@dnd-kit/sortable";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";
import type { GridContainerComponent } from "@acme/types/page/layouts/grid-container";
import type { SectionComponent } from "@acme/types/page/layouts/section";
import type { TabsComponent } from "@acme/types/page/layouts/tabs";
import type { TabsAccordionContainerComponent } from "@acme/types/page/layouts/tabs-accordion-container";

import type { BlockChildrenProps as Props, SlotDef } from "./BlockChildren.types";
import DefaultChildrenList from "./DefaultChildrenList";
import GridAreaChildren from "./GridAreaChildren";
import GridOverlay from "./GridOverlay";
import type { EditorFlags } from "./state/layout/types";
import { isHiddenForViewport } from "./state/layout/utils";
import TabbedChildren from "./TabbedChildren";

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
  preferParentOnClick = false,
}: Props) {
  const t = useTranslations();
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const underlyingChildren = (childComponents ?? []);
  let visibleChildren = underlyingChildren.filter((c) =>
    !isHiddenForViewport(c.id, editor, (c as Partial<{ hidden?: boolean }>).hidden, viewport)
  );
  // Apply container stacking presets per viewport
  {
    const flags = (editor?.[component.id] ?? {}) as Partial<EditorFlags>;
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const devKey = `stack${cap(viewport)}`;
    const strategy = (flags as Record<string, unknown>)[devKey] as "default" | "reverse" | "custom" | undefined
      ?? (viewport === "mobile" ? (flags.stackStrategy ?? "default") : "default");
    if (strategy === "reverse") {
      visibleChildren = [...visibleChildren].reverse();
    } else if (strategy === "custom") {
      visibleChildren = [...visibleChildren].sort((a, b) => {
        type OrderKey = "orderDesktop" | "orderTablet" | "orderMobile";
        const key = `order${cap(viewport)}` as OrderKey;
        const e = editor as Record<string, Partial<EditorFlags>> | undefined;
        const oa = e?.[a.id]?.[key];
        const ob = e?.[b.id]?.[key];
        const da = oa === undefined ? Number.POSITIVE_INFINITY : oa;
        const db = ob === undefined ? Number.POSITIVE_INFINITY : ob;
        if (da === db) return 0;
        return da < db ? -1 : 1;
      });
    }
  }
  const handleSetContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerElRef.current = node;
    setDropRef(node);
  }, [setDropRef]);

  if (visibleChildren.length === 0) return null;
  const section = component as Partial<SectionComponent>;
  const effGridCols = Number.isFinite(section.gridCols) && (section.gridCols ?? 0) > 0 ? (section.gridCols as number) : gridCols;
  const effGridEnabled = section.gridSnap !== undefined ? !!section.gridSnap : gridEnabled;
  const effGutter = section.gridGutter as string | undefined;
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
  const compType = component.type as string;
  const isTabbed = compType === "Tabs" || compType === "TabsAccordionContainer";
  const isGridArea = compType === "Grid" && typeof (component as Partial<GridContainerComponent>).areas === 'string' && ((component as Partial<GridContainerComponent>).areas as string).trim().length > 0;

  // If tabbed container, group children by slotKey
  let slots: SlotDef[] | null = null;
  if (isTabbed) {
    let titles: string[];
    if (compType === "Tabs") {
      // Support legacy shape where Tabs used `tabs` instead of `labels`.
      const labels = ((component as Partial<TabsComponent>).labels ?? []) as string[];
      const legacyTabs = ((component as Partial<TabsAccordionContainerComponent>).tabs ?? []) as string[];
      titles = labels.length > 0 ? labels : legacyTabs;
    } else {
      titles = (((component as Partial<TabsAccordionContainerComponent>).tabs ?? []) as string[]);
    }
    slots = (titles.length > 0 ? titles : [t("Content 1") as string, t("Content 2") as string]).map((title: string, i: number) => ({ key: String(i), title }));
    // sort visibleChildren by slotKey (undefined => 0), preserving underlying order within slot
    const slotIndex = (c: PageComponent) => {
      const s = (c as Partial<{ slotKey?: string }>).slotKey;
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

  // Compute container class name once (utility classes only).
  const containerClass =
     
    "border-muted relative m-2 flex flex-col gap-4 border border-dashed p-2 " +
     
    (isOver && dropAllowed === false ? "ring-2 ring-danger border-danger cursor-not-allowed" : "");

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
        aria-label={t("Container") as string}
        data-cy="pb-container"
        data-cy-parent-id={component.id}
        className={containerClass}
        data-tab-titles={isTabbed && slots ? JSON.stringify(slots.map((s) => s.title)) : undefined}
      >
        {effGridEnabled && (
           
          <div className="absolute inset-0"><GridOverlay gridCols={effGridCols} gutter={effGutter} /></div>
        )}
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
            preferParentOnClick={preferParentOnClick}
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
            preferParentOnClick={preferParentOnClick}
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
            preferParentOnClick={preferParentOnClick}
          />
        )}
      </div>
    </SortableContext>
  );
}
