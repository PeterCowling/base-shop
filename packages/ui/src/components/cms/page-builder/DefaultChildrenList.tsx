"use client";

import type { PageComponent, HistoryState } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import GridChildControls from "./GridChildControls";

type Props = {
  component: PageComponent;
  visibleChildren: PageComponent[];
  underlyingChildren: PageComponent[];
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
  containerElRef: React.MutableRefObject<HTMLDivElement | null>;
  toUnderlyingIndex: (uiIndex: number) => number;
  compType: string;
};

export default function DefaultChildrenList({
  component,
  visibleChildren,
  underlyingChildren: _underlyingChildren,
  selectedIds,
  onSelect,
  dispatch,
  locale,
  effGridEnabled,
  effGridCols,
  viewport,
  device,
  editor,
  baselineSnap,
  baselineStep,
  containerElRef,
  toUnderlyingIndex,
  compType,
}: Props) {
  const isGrid = compType === "Grid";

  return (
    <>
      {visibleChildren.map((child, i) => (
        <div key={child.id} className="relative group">
          {isGrid && (
            <GridChildControls
              enabled={true}
              parent={component}
              child={child}
              dispatch={dispatch}
              containerElRef={containerElRef}
            />
          )}

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
          try {
            window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
          } catch {}
        }}
      />
    </>
  );
}
