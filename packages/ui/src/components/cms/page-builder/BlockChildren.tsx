"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent, HistoryState } from "@acme/types";
import { isHiddenForViewport } from "./state/layout/utils";
import CanvasItem from "./CanvasItem";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";

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
  let visibleChildren = (childComponents ?? []).filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
  // Apply container stacking presets for mobile
  if (viewport === "mobile") {
    const strategy = (editor?.[component.id]?.stackStrategy as "default" | "reverse" | undefined) ?? "default";
    if (strategy === "reverse") {
      visibleChildren = [...visibleChildren].reverse();
    }
  }
  if (visibleChildren.length === 0) return null;
  const childIds = visibleChildren.map((c) => c.id);
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
        className="border-muted m-2 flex flex-col gap-4 border border-dashed p-2"
      >
        {isOver && (
          <div
            data-placeholder
            className="border-primary bg-primary/10 ring-primary h-4 w-full rounded border-2 border-dashed ring-2"
          />
        )}
        {visibleChildren.map((child, i) => (
          <CanvasItem
            key={child.id}
            component={child}
            index={i}
            parentId={component.id}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onRemove={() => dispatch({ type: "remove", id: child.id })}
            dispatch={dispatch}
            locale={locale}
            gridEnabled={gridEnabled}
            gridCols={gridCols}
            viewport={viewport}
            device={device}
            editor={editor}
          />
        ))}
      </div>
    </SortableContext>
  );
}
