"use client";

import { type Dispatch, type SetStateAction,useEffect, useState } from "react";

import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style/cn";
import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import type { HistoryState, PageComponent } from "@acme/types";
import type { DevicePreset } from "@acme/ui/utils/devicePresets";

import type { SlotDef } from "./BlockChildren.types";
import CanvasItem from "./CanvasItem";
import InlineInsert from "./InlineInsert";
import type { Action } from "./state";

type Props = {
  component: PageComponent;
  visibleChildren: PageComponent[];
  underlyingChildren: PageComponent[];
  slots: SlotDef[];
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

type PageComponentWithSlot = PageComponent & { slotKey?: string };

interface DragTabsHeaderProps {
  slots: SlotDef[];
  componentId: string;
  dragActive: boolean;
  hoverTab: number | null;
  setHoverTab: Dispatch<SetStateAction<number | null>>;
}

function DragTabsHeader({ slots, componentId, dragActive, hoverTab, setHoverTab }: DragTabsHeaderProps) {
  if (!dragActive) return null;
  return (
    <Cluster gap={2} wrap className="sticky top-0 mb-2 bg-background/80 p-2 backdrop-blur">
      {slots.map((s, i) => (
        <button
          type="button"
          key={`tab-head-${s.key}`}
          onMouseEnter={() => {
            setHoverTab(i);
            try {
              window.dispatchEvent(
                new CustomEvent("pb-tab-hover", { detail: { parentId: componentId, tabIndex: i } })
              );
            } catch {}
          }}
          onMouseLeave={() => setHoverTab((prev) => (prev === i ? null : prev))}
          onFocus={() => setHoverTab(i)}
          onBlur={() => setHoverTab((prev) => (prev === i ? null : prev))}
          aria-pressed={hoverTab === i}
          className={cn(
            "rounded border px-2 py-1 text-xs",
            hoverTab === i ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-dashed"
          )}
        >
          {s.title}
        </button>
      ))}
    </Cluster>
  );
}

interface SlotSectionProps {
  slot: SlotDef;
  sIdx: number;
  slots: SlotDef[];
  component: PageComponent;
  visibleChildren: PageComponent[];
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  effGridEnabled: boolean;
  effGridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  editor?: HistoryState["editor"];
  toUnderlyingIndex: (uiIndex: number) => number;
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  dropAllowed?: boolean | null;
  preferParentOnClick?: boolean;
  t: ReturnType<typeof useTranslations>;
  highlight: boolean;
}

function SlotSection({
  slot,
  sIdx,
  slots,
  component,
  visibleChildren,
  selectedIds,
  onSelect,
  dispatch,
  locale,
  effGridEnabled,
  effGridCols,
  viewport,
  device,
  editor,
  toUnderlyingIndex,
  insertParentId,
  insertIndex,
  dropAllowed,
  preferParentOnClick,
  t,
  highlight,
}: SlotSectionProps) {
  const slotChildren = visibleChildren.filter((c) => {
    const sk = (c as PageComponentWithSlot).slotKey;
    return sk === String(sIdx) || (sk == null && sIdx === 0);
  });
  const firstIdx =
    slotChildren.length > 0
      ? visibleChildren.findIndex((c) => c.id === slotChildren[0]!.id)
      : visibleChildren.findIndex((c) => {
          const sk = (c as PageComponentWithSlot).slotKey;
          const val = sk != null ? Number(sk) : 0;
          return val >= sIdx;
        });
  const startIndex = firstIdx >= 0 ? firstIdx : visibleChildren.length;
  const endIndex =
    slotChildren.length > 0
      ? visibleChildren.findIndex((c) => c.id === slotChildren[slotChildren.length - 1]!.id) + 1
      : startIndex;
  return (
    <div key={slot.key} className="rounded border p-2">
      <div className={`mb-2 text-xs font-medium ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {slot.title}
      </div>
      <InlineInsert
        index={startIndex}
        // i18n-exempt -- DS-1234 [ttl=2026-06-30]
        context="child"
        containerType={component.type}
        onInsert={(newComponent, index) => {
          (newComponent as PageComponentWithSlot).slotKey = String(sIdx);
          const insertAt = toUnderlyingIndex(index);
          dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
          try {
            window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
          } catch {}
        }}
      />
      {insertParentId === component.id && insertIndex === startIndex && (
        <div
          data-placeholder
          className={cn(
            // i18n-exempt -- DS-1234 [ttl=2026-06-30]
            "mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none",
            dropAllowed === false
              ? (
                // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                "border-danger bg-danger/10 ring-2 ring-danger"
              )
              : (
                // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                "border-primary bg-primary/10 ring-2 ring-primary"
              )
          )}
        />
      )}
      {slotChildren.map((child) => {
        const i = visibleChildren.findIndex((c) => c.id === child.id);
        return (
          <div key={child.id} className="relative group">
            {insertParentId === component.id && insertIndex === i && (
              <div
                data-placeholder
                className={cn(
                  // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                  "mb-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none",
                  dropAllowed === false
                    ? (
                      // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                      "border-danger bg-danger/10 ring-2 ring-danger"
                    )
                    : (
                      // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                      "border-primary bg-primary/10 ring-2 ring-primary"
                    )
                )}
              />
            )}
            <div className="absolute -top-3 -start-2.5">
              <Select
                value={String((child as PageComponentWithSlot).slotKey ?? 0)}
                onValueChange={(v) =>
                  dispatch({
                    type: "update",
                    id: child.id,
                    patch: { slotKey: v } as Partial<PageComponentWithSlot>,
                  })
                }
              >
                <SelectTrigger className="h-6 w-24 px-2 py-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slotOption, idx2) => (
                    <SelectItem key={slotOption.key} value={String(idx2)}>
                      {slotOption.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CanvasItem
              component={child}
              index={i}
              parentId={component.id}
              parentType={component.type as string}
              parentSlots={slots.length}
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
              insertParentId={insertParentId}
              insertIndex={insertIndex}
              dropAllowed={dropAllowed}
              preferParentOnClick={preferParentOnClick}
            />
            <InlineInsert
              index={i + 1}
              // i18n-exempt -- DS-1234 [ttl=2026-06-30]
              context="child"
              containerType={component.type}
              onInsert={(newComponent, index) => {
                (newComponent as PageComponentWithSlot).slotKey = String(sIdx);
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
                try {
                  window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
                } catch {}
              }}
            />
            {insertParentId === component.id && insertIndex === i + 1 && (
              <div
                data-placeholder
                className={cn(
                  // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                  "mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none",
                  dropAllowed === false
                    ? (
                      // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                      "border-danger bg-danger/10 ring-2 ring-danger"
                    )
                    : (
                      // i18n-exempt -- DS-1234 [ttl=2026-06-30]
                      "border-primary bg-primary/10 ring-2 ring-primary"
                    )
                )}
              />
            )}
          </div>
        );
      })}
      <InlineInsert
        index={endIndex}
        // i18n-exempt -- DS-1234 [ttl=2026-06-30]
        context="child"
        containerType={component.type}
        onInsert={(newComponent, index) => {
          (newComponent as PageComponentWithSlot).slotKey = String(sIdx);
          const insertAt = toUnderlyingIndex(index);
          dispatch({ type: "add", component: newComponent, parentId: component.id, index: insertAt });
          try {
            window.dispatchEvent(new CustomEvent("pb-live-message", { detail: t("pb.blockInserted") as string }));
          } catch {}
        }}
      />
      {insertParentId === component.id && insertIndex === endIndex && (
        <div
          data-placeholder
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2026-06-30]
          "mt-1 h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none",
          dropAllowed === false
            ? (
              // i18n-exempt -- DS-1234 [ttl=2026-06-30]
              "border-danger bg-danger/10 ring-2 ring-danger"
            )
            : (
              // i18n-exempt -- DS-1234 [ttl=2026-06-30]
              "border-primary bg-primary/10 ring-2 ring-primary"
            )
        )}
      />
      )}
    </div>
  );
}

export default function TabbedChildren({
  component,
  visibleChildren,
  underlyingChildren: _underlyingChildren,
  slots,
  selectedIds,
  onSelect,
  dispatch,
  locale,
  effGridEnabled,
  effGridCols,
  viewport,
  device,
  editor,
  baselineSnap: _baselineSnap,
  baselineStep: _baselineStep,
  toUnderlyingIndex,
  insertParentId,
  insertIndex,
  dropAllowed,
  preferParentOnClick = false,
}: Props) {
  const t = useTranslations();
  // Track dragging to show sticky tab headers
  const [dragActive, setDragActive] = useState(false);
  const [hoverTab, setHoverTab] = useState<number | null>(null);
  useEffect(() => {
    const onStart: EventListener = () => setDragActive(true);
    const onEnd: EventListener = () => {
      setDragActive(false);
      setHoverTab(null);
    };
    window.addEventListener("pb-drag-start", onStart);
    window.addEventListener("pb-drag-end", onEnd);
    return () => {
      window.removeEventListener("pb-drag-start", onStart);
      window.removeEventListener("pb-drag-end", onEnd);
    };
  }, []);

  return (
    <>
      <DragTabsHeader
        slots={slots}
        componentId={component.id}
        dragActive={dragActive}
        hoverTab={hoverTab}
        setHoverTab={setHoverTab}
      />
      {slots.map((slot, sIdx) => (
        <SlotSection
          key={slot.key}
          slot={slot}
          sIdx={sIdx}
          slots={slots}
          component={component}
          visibleChildren={visibleChildren}
          selectedIds={selectedIds}
          onSelect={onSelect}
          dispatch={dispatch}
          locale={locale}
          effGridEnabled={effGridEnabled}
          effGridCols={effGridCols}
          viewport={viewport}
          device={device}
          editor={editor}
          toUnderlyingIndex={toUnderlyingIndex}
          insertParentId={insertParentId}
          insertIndex={insertIndex}
          dropAllowed={dropAllowed}
          preferParentOnClick={preferParentOnClick}
          t={t}
          highlight={dragActive && hoverTab === sIdx}
        />
      ))}
    </>
  );
}
