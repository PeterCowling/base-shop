/* eslint-disable ds/no-hardcoded-copy -- PB-0001: internal builder strings and utility classes */
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
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  dropAllowed?: boolean | null;
  preferParentOnClick?: boolean;
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
  insertParentId,
  insertIndex,
  dropAllowed,
  preferParentOnClick = false,
}: Props) {
  const isGrid = compType === "Grid";

  return (
    <>
      {visibleChildren.map((child, i) => (
        <div key={child.id} className="relative group">
          {insertParentId === component.id && insertIndex === i && (
            <div
              data-placeholder
              className={
                (dropAllowed === false
                  ? "border-danger bg-danger/10 ring-2 ring-danger"
                  : "border-primary bg-primary/10 ring-2 ring-primary") +
                " mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none" // i18n-exempt: utility class names
              }
            />
          )}
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
            context="child" /* i18n-exempt: internal builder context label */
            containerType={component.type}
            onInsert={(newComponent, index) => {
              const insertAt = toUnderlyingIndex(index);
              dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
              try {
                // i18n-exempt: developer-only live message for builder integrations
                window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
              } catch {}
            }}
          />
          <CanvasItem
            component={child}
            index={i}
            parentId={component.id}
            parentType={component.type as string}
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
            insertParentId={insertParentId}
            insertIndex={insertIndex}
            dropAllowed={dropAllowed}
            preferParentOnClick={preferParentOnClick}
          />
        </div>
      ))}
      {insertParentId === component.id && insertIndex === visibleChildren.length && (
        <div
          data-placeholder
          className={
            (dropAllowed === false
              ? "border-danger bg-danger/10 ring-2 ring-danger"
              : "border-primary bg-primary/10 ring-2 ring-primary") +
            " mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none" // i18n-exempt: utility class names
          }
        />
      )}
      <InlineInsert
        index={visibleChildren.length}
        context="child" /* i18n-exempt: internal builder context label */
        containerType={component.type}
        onInsert={(newComponent, index) => {
          const insertAt = toUnderlyingIndex(index);
          dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
          try {
            // i18n-exempt: developer-only live message for builder integrations
            window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" }));
          } catch {}
        }}
      />
    </>
  );
}
