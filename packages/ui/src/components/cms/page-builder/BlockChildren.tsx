"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import CanvasItem from "./CanvasItem";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";

interface Props {
  component: PageComponent;
  childComponents?: PageComponent[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  isOver: boolean;
  setDropRef: (node: HTMLDivElement | null) => void;
}

export default function BlockChildren({
  component,
  childComponents,
  selectedId,
  onSelectId,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
  device,
  isOver,
  setDropRef,
}: Props) {
  if (!childComponents || childComponents.length === 0) return null;
  const childIds = childComponents.map((c) => c.id);
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
        {childComponents.map((child, i) => (
          <CanvasItem
            key={child.id}
            component={child}
            index={i}
            parentId={component.id}
            selectedId={selectedId}
            onSelectId={onSelectId}
            onRemove={() => dispatch({ type: "remove", id: child.id })}
            dispatch={dispatch}
            locale={locale}
            gridEnabled={gridEnabled}
            gridCols={gridCols}
            viewport={viewport}
            device={device}
          />
        ))}
      </div>
    </SortableContext>
  );
}

