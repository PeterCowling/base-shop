"use client";

import { cn } from "../../../../utils/style";
import { useTranslations } from "@acme/i18n";
import InlineInsert from "../InlineInsert";
import CanvasItem from "../CanvasItem";
import type { Props } from "./types";

interface CanvasListProps {
  components: Props["components"];
  visibleComponents: Props["components"];
  toUnderlyingIndex: (uiIndex: number) => number;
  selectedIds: string[];
  onSelectIds: Props["onSelectIds"];
  dispatch: Props["dispatch"];
  locale: Props["locale"];
  snapEnabled?: Props["snapEnabled"];
  showGrid: Props["showGrid"];
  gridCols: Props["gridCols"];
  viewport: Props["viewport"];
  device: Props["device"];
  editor: Props["editor"];
  zoom: Props["zoom"];
  showBaseline: Props["showBaseline"];
  baselineStep: Props["baselineStep"];
  dropAllowed?: Props["dropAllowed"];
  insertParentId?: Props["insertParentId"];
  insertIndex: Props["insertIndex"];
  snapPosition: Props["snapPosition"];
  preferParentOnClick?: Props["preferParentOnClick"];
}

function InsertPlaceholder({ active, dropAllowed, snapPosition }: { active: boolean; dropAllowed?: boolean | null; snapPosition: number | null }) {
  if (!active) return null;
  return (
    <div
      data-placeholder
      className={cn(
        "h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt -- PB-2419 utility class names
        dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10", // i18n-exempt -- PB-2419 utility class names
        snapPosition !== null && (dropAllowed === false ? "ring-2 ring-danger" : "ring-2 ring-primary") // i18n-exempt -- PB-2419 utility class names
      )}
    />
  );
}

export default function CanvasList(props: CanvasListProps) {
  const t = useTranslations();
  const {
    visibleComponents,
    toUnderlyingIndex,
    selectedIds,
    onSelectIds,
    dispatch,
    locale,
    snapEnabled,
    showGrid,
    gridCols,
    viewport,
    device,
    editor,
    zoom,
    showBaseline,
    baselineStep,
    dropAllowed,
    insertParentId,
    insertIndex,
    snapPosition,
    preferParentOnClick,
  } = props;

  return (
    <>
      {visibleComponents.map((c, i) => (
        <div key={c.id} className="relative group">
          <InlineInsert
            index={i}
            context="top"
            onInsert={(component, index) => {
              const insertAt = toUnderlyingIndex(index);
              dispatch({ type: "add", component, index: insertAt });
              onSelectIds([component.id]);
              try {
                window.dispatchEvent(
                  new CustomEvent(
                    "pb-live-message", // i18n-exempt -- CMS developer event name, not user copy
                    {
                      detail: t("pb.blockInserted") as string,
                    },
                  ),
                );
              } catch {}
            }}
          />
          <InsertPlaceholder active={insertParentId === undefined && insertIndex === i} dropAllowed={dropAllowed} snapPosition={snapPosition} />
          <CanvasItem
            component={c}
            index={i}
            parentId={undefined}
            selectedIds={selectedIds}
            onSelect={(id, e) => {
              if (e?.metaKey || e?.ctrlKey || e?.shiftKey) {
                const exists = selectedIds.includes(id);
                onSelectIds(exists ? selectedIds.filter((sid) => sid !== id) : [...selectedIds, id]);
              } else {
                onSelectIds([id]);
              }
              setTimeout(() => { (document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null)?.focus?.(); }, 0); // i18n-exempt -- CSS selector literal, not user-facing copy
            }}
            onRemove={() => dispatch({ type: "remove", id: c.id })}
            dispatch={dispatch}
            locale={locale}
            gridEnabled={snapEnabled ?? showGrid}
            gridCols={gridCols}
            viewport={viewport}
            device={device}
            editor={editor}
            zoom={zoom}
            baselineSnap={showBaseline}
            baselineStep={baselineStep}
            dropAllowed={dropAllowed}
            insertParentId={insertParentId}
            insertIndex={insertIndex}
            preferParentOnClick={preferParentOnClick}
          />
        </div>
      ))}
      <InlineInsert
        index={visibleComponents.length}
        context="top"
        onInsert={(component, index) => {
          const insertAt = toUnderlyingIndex(index);
          dispatch({ type: "add", component, index: insertAt });
          onSelectIds([component.id]);
          try {
            window.dispatchEvent(
              new CustomEvent(
                "pb-live-message", // i18n-exempt -- CMS developer event name, not user copy
                {
                  detail: t("pb.blockInserted") as string,
                },
              ),
            );
          } catch {}
        }}
      />
      <InsertPlaceholder active={insertParentId === undefined && insertIndex === visibleComponents.length} dropAllowed={dropAllowed} snapPosition={snapPosition} />
    </>
  );
}
