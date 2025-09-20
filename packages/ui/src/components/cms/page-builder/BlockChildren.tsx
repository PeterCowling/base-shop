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
  return (
    <SortableContext
      id={`context-${component.id}`}
      items={childIds}
      strategy={rectSortingStrategy}
    >
      <div
        ref={setDropRef}
        id={`container-${component.id}`}
        role="list"
        aria-dropeffect="move"
        className="border-muted relative m-2 flex flex-col gap-4 border border-dashed p-2"
      >
        {effGridEnabled && <div className="absolute inset-0"><GridOverlay gridCols={effGridCols} gutter={effGutter} /></div>}
        {isOver && (
          <div
            data-placeholder
            className="border-primary bg-primary/10 ring-primary h-4 w-full rounded border-2 border-dashed ring-2"
          />
        )}
        {visibleChildren.map((child, i) => (
          <div key={child.id} className="relative group">
            <InlineInsert
              index={i}
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
                } catch {}
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
            try {
              window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
            } catch {}
          }}
        />
      </div>
    </SortableContext>
  );
}
