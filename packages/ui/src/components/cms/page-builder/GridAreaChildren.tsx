"use client";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/types";

import type { DevicePreset } from "../../../utils/devicePresets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";

import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import type { Action } from "./state";

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
  toUnderlyingIndex: (uiIndex: number) => number;
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  dropAllowed?: boolean | null;
  preferParentOnClick?: boolean;
};

export default function GridAreaChildren({
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
  toUnderlyingIndex,
  insertParentId,
  insertIndex,
  dropAllowed,
  preferParentOnClick = false,
}: Props) {
  const t = useTranslations();
  const raw = component.type === "Grid" && typeof component.areas === "string" ? component.areas : "";
  const names = new Set<string>();
  raw
    .split(/\n+/)
    .map((line: string) => line.trim().replace(/^"|"$/g, ""))
    .filter(Boolean)
    .forEach((line: string) => {
      line.split(/\s+/).forEach((token: string) => {
        if (token && token !== ".") names.add(token);
      });
    });
  const gridAreas = Array.from(names.values());

  return (
    <>
      {gridAreas.map((area) => {
        const areaChildren = visibleChildren.filter(
          (c) => String((c as Record<string, unknown>)["gridArea"]) === area,
        );
        const firstIdx =
          areaChildren.length > 0
            ? visibleChildren.findIndex((c) => c.id === areaChildren[0]!.id)
            : visibleChildren.length;
        const endIndex =
          areaChildren.length > 0
            ? visibleChildren.findIndex((c) => c.id === areaChildren[areaChildren.length - 1]!.id) + 1
            : firstIdx;
        return (
          <div key={area} className="rounded border p-2">
            <div className="text-muted-foreground mb-2 text-xs font-medium">
              {t("pb.grid.areaLabel")} <code>{area}</code>
            </div>
            <InlineInsert
              index={firstIdx}
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                (newComponent as Record<string, unknown>)["gridArea"] = area;
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === firstIdx && (
              // i18n-exempt -- ABC-123 [ttl=2025-03-31]
              <div data-placeholder className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"} />
            )}
            {areaChildren.map((child) => {
              const i = visibleChildren.findIndex((c) => c.id === child.id);
              return (
                <div key={child.id} className="relative group">
                  {insertParentId === component.id && insertIndex === i && (
                    // i18n-exempt -- ABC-123 [ttl=2025-03-31]
                    <div data-placeholder className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"} />
                  )}
                  <div className="absolute -top-3 -start-2.5">
                    <Select
                      value={String((child as Record<string, unknown>)["gridArea"] ?? area)}
                      onValueChange={(v) =>
                        dispatch({ type: "update", id: child.id, patch: { gridArea: v } as Partial<PageComponent> })
                      }
                    >
                      <SelectTrigger className="h-6 w-28 px-2 py-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gridAreas.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CanvasItem
                    component={child}
                    index={i}
                    parentId={component.id}
                    parentType={component.type}
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
                  <InlineInsert
                    index={i + 1}
                    context="child"
                    containerType={component.type}
                    onInsert={(newComponent, index) => {
                      (newComponent as Record<string, unknown>)["gridArea"] = area;
                      const insertAt = toUnderlyingIndex(index);
                      dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                      try {
                        window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                      } catch {}
                    }}
                  />
                  {insertParentId === component.id && insertIndex === i + 1 && (
                    // i18n-exempt -- ABC-123 [ttl=2025-03-31]
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
                (newComponent as Record<string, unknown>)["gridArea"] = area;
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === endIndex && (
              // i18n-exempt -- ABC-123 [ttl=2025-03-31]
              <div data-placeholder className={(dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10 ring-2 ring-primary") + " mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none"} />
            )}
          </div>
        );
      })}
    </>
  );
}
