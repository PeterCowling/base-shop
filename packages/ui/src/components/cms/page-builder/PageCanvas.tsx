"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, DragEvent } from "react";
import { Fragment, useEffect, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import { isHiddenForViewport } from "./state/layout/utils";
import CanvasItem from "./CanvasItem";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "./state";
import { cn } from "../../../utils/style";
import type { DevicePreset } from "../../../utils/devicePresets";
import GridOverlay from "./GridOverlay";
import SnapLine from "./SnapLine";
import Block from "./Block";
import RulersOverlay from "./RulersOverlay";
import MultiSelectOverlay from "./MultiSelectOverlay";

interface Props {
  components: PageComponent[];
  selectedIds?: string[];
  onSelectIds?: (ids: string[]) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  dragOver?: boolean;
  setDragOver?: (v: boolean) => void;
  onFileDrop?: (e: DragEvent<HTMLDivElement>) => void;
  insertIndex?: number | null;
  dispatch?: (action: Action) => void;
  locale: Locale;
  containerStyle: CSSProperties;
  showGrid?: boolean;
  gridCols?: number;
  snapEnabled?: boolean;
  showRulers?: boolean;
  viewport: "desktop" | "tablet" | "mobile";
  snapPosition?: number | null;
  device?: DevicePreset;
  preview?: boolean;
  editor?: HistoryState["editor"];
}

const PageCanvas = ({
  components,
  selectedIds = [],
  onSelectIds = () => {},
  canvasRef,
  dragOver = false,
  setDragOver = () => {},
  onFileDrop = () => {},
  insertIndex = null,
  dispatch = () => {},
  locale,
  containerStyle,
  showGrid = false,
  gridCols = 1,
  snapEnabled,
  showRulers = false,
  viewport,
  snapPosition = null,
  device,
  preview = false,
  editor,
}: Props) => {
  const [dropRect, setDropRect] = useState<
    { left: number; top: number; width: number; height: number } | null
  >(null);

  const findById = (list: PageComponent[], id: string): PageComponent | null => {
    for (const c of list) {
      if (c.id === id) return c;
      const children = (c as { children?: PageComponent[] }).children;
      if (Array.isArray(children)) {
        const found = findById(children, id);
        if (found) return found;
      }
    }
    return null;
  };
  const selectedComponents = (selectedIds ?? [])
    .map((id) => findById(components, id))
    .filter(Boolean) as PageComponent[];
  const canGroupTransform = (selectedIds?.length ?? 0) > 1 && selectedComponents.every((c) => (c as any).position === "absolute");
  const unlockedIds = selectedComponents
    .filter((c) => {
      const isLocked = (editor as any)?.[c.id]?.locked ?? (c as any).locked ?? false;
      return (c as any).position === "absolute" && !isLocked;
    })
    .map((c) => c.id);
  const hasLockedInSelection = selectedComponents.some((c) => ((editor as any)?.[c.id]?.locked ?? (c as any).locked ?? false));
  const lockedIds = selectedComponents.filter((c) => ((editor as any)?.[c.id]?.locked ?? (c as any).locked ?? false)).map((c) => c.id);

  // Dim locked items visually while group overlay is active
  useEffect(() => {
    const dimmed: HTMLElement[] = [];
    if ((selectedIds?.length ?? 0) > 1 && canGroupTransform && lockedIds.length > 0) {
      lockedIds.forEach((id) => {
        const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
        if (el) {
          (el as any).dataset.pbPrevOpacity = el.style.opacity;
          el.style.opacity = "0.4";
          dimmed.push(el);
        }
      });
    }
    return () => {
      dimmed.forEach((el) => {
        const prev = (el as any).dataset.pbPrevOpacity as string | undefined;
        el.style.opacity = prev ?? "";
        if ((el as any).dataset) delete (el as any).dataset.pbPrevOpacity;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGroupTransform, selectedIds?.length, lockedIds.join(",")]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (preview) return;
    e.preventDefault();
    setDragOver(true);
    const target = (e.target as HTMLElement).closest(
      '[role="listitem"], #canvas'
    );
    if (target instanceof HTMLElement && canvasRef?.current) {
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      setDropRect({
        left: rect.left - canvasBounds.left,
        top: rect.top - canvasBounds.top,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setDropRect(null);
    }
  };

  const clearHighlight = () => {
    setDragOver(false);
    setDropRect(null);
  };

  if (preview) {
    return (
      <div
        id="canvas"
        ref={canvasRef}
        style={containerStyle}
        className="relative mx-auto flex flex-col gap-4"
      >
        {components
          .filter(
            (c) =>
              !isHiddenForViewport(
                c.id,
                editor,
                (c as any).hidden as boolean | undefined,
                viewport,
              ),
          )
          .map((c) => {
            const flags = (editor ?? {})[c.id];
            const hidden = (flags?.hidden ?? []) as ("desktop" | "tablet" | "mobile")[];
            const hideClasses = [
              hidden.includes("desktop") ? "pb-hide-desktop" : "",
              hidden.includes("tablet") ? "pb-hide-tablet" : "",
              hidden.includes("mobile") ? "pb-hide-mobile" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={c.id} className={["pb-scope", hideClasses].filter(Boolean).join(" ") || undefined}>
                <Block component={c} locale={locale} />
              </div>
            );
          })}
      </div>
    );
  }

  const visibleComponents = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
  return (
    <SortableContext
      items={visibleComponents.map((c) => c.id)}
      strategy={rectSortingStrategy}
    >
      <div
        id="canvas"
        ref={canvasRef}
        style={containerStyle}
        role="list"
        aria-dropeffect="move"
        onDrop={onFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={clearHighlight}
        onDragEnd={clearHighlight}
        className={cn(
          "relative mx-auto flex flex-col gap-4 rounded border",
          dragOver && "ring-2 ring-primary"
        )}
      >
        {dropRect && (
          <div
            className="pointer-events-none absolute z-50 rounded border-2 border-primary/50 bg-primary/10"
            style={{
              left: dropRect.left,
              top: dropRect.top,
              width: dropRect.width,
              height: dropRect.height,
            }}
          />
        )}
        <RulersOverlay show={showRulers} canvasRef={canvasRef} step={100} />
        {selectedIds.length > 1 && canGroupTransform && unlockedIds.length > 0 && (
          <MultiSelectOverlay
            canvasRef={canvasRef}
            ids={unlockedIds}
            viewport={viewport}
            gridEnabled={snapEnabled ?? showGrid}
            gridCols={gridCols}
            onApply={(patches) => {
              const widthKey =
                viewport === "desktop"
                  ? "widthDesktop"
                  : viewport === "tablet"
                    ? "widthTablet"
                    : "widthMobile";
              const heightKey =
                viewport === "desktop"
                  ? "heightDesktop"
                  : viewport === "tablet"
                    ? "heightTablet"
                    : "heightMobile";
              const allowed = new Set(unlockedIds);
              Object.entries(patches).forEach(([id, p]) => {
                if (!allowed.has(id)) return;
                if (!p) return;
                const patch: Record<string, string | undefined> = { left: p.left, top: p.top };
                if (p.width !== undefined) patch[widthKey] = p.width;
                if (p.height !== undefined) patch[heightKey] = p.height;
                dispatch({ type: "resize", id, ...(patch as any) });
              });
            }}
          />
        )}
        {selectedIds.length > 1 && !canGroupTransform && (
          <div className="pointer-events-none absolute left-2 top-2 z-40 rounded bg-muted/70 px-2 py-1 text-xs text-muted-foreground">
            Group move/resize works only for absolute-positioned items
          </div>
        )}
        {selectedIds.length > 1 && canGroupTransform && hasLockedInSelection && (
          <div className="pointer-events-none absolute left-2 top-8 z-40 rounded bg-muted/70 px-2 py-1 text-xs text-muted-foreground">
            Locked items are ignored during group move/resize
          </div>
        )}
        {showGrid && <GridOverlay gridCols={gridCols} />}
        <SnapLine x={snapPosition} />
        {visibleComponents.map((c, i) => (
          <Fragment key={c.id}>
            {insertIndex === i && (
              <div
                data-placeholder
                className={cn(
                  "h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10",
                  snapPosition !== null && "ring-2 ring-primary"
                )}
              />
            )}
            <CanvasItem
              component={c}
              index={i}
              parentId={undefined}
              selectedIds={selectedIds}
              onSelect={(id, e) => {
                if (e?.metaKey || e?.ctrlKey || e?.shiftKey) {
                  const exists = selectedIds.includes(id);
                  onSelectIds(
                    exists
                      ? selectedIds.filter((sid) => sid !== id)
                      : [...selectedIds, id]
                  );
                } else {
                  onSelectIds([id]);
                }
              }}
              onRemove={() => dispatch({ type: "remove", id: c.id })}
              dispatch={dispatch}
              locale={locale}
              gridEnabled={snapEnabled ?? showGrid}
              gridCols={gridCols}
              viewport={viewport}
              device={device}
              editor={editor}
            />
          </Fragment>
        ))}
        {insertIndex === visibleComponents.length && (
          <div
            data-placeholder
            className={cn(
              "h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10",
              snapPosition !== null && "ring-2 ring-primary"
            )}
          />
        )}
      </div>
    </SortableContext>
  );
};

export default PageCanvas;
