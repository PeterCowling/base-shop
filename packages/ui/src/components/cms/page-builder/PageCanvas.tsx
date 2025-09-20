"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { CSSProperties, DragEvent } from "react";
import { Fragment, useEffect, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import { isHiddenForViewport, getParentOfId } from "./state/layout/utils";
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
import InlineInsert from "./InlineInsert";
import CommentsLayer from "./CommentsLayer";

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
  shop?: string | null;
  pageId?: string | null;
  showComments?: boolean;
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
  shop,
  pageId,
  showComments = true,
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
                <Block component={{ ...(c as any), pbViewport: viewport } as any} locale={locale} />
              </div>
            );
          })}
      </div>
    );
  }

  const visibleComponents = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
  const toUnderlyingIndex = (uiIndex: number): number => {
    if (uiIndex < visibleComponents.length) {
      const targetId = visibleComponents[uiIndex]?.id;
      if (targetId) {
        const idx = components.findIndex((c) => c.id === targetId);
        return idx >= 0 ? idx : components.length;
      }
    }
    return components.length;
  };
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
        {shop && pageId && showComments && (
          <CommentsLayer canvasRef={canvasRef as any} components={components} shop={shop ?? ""} pageId={pageId ?? ""} selectedIds={selectedIds} />
        )}
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
        <RulersOverlay
          show={showRulers}
          canvasRef={canvasRef}
          step={100}
          viewport={viewport}
          contentWidth={(function () {
            // Determine active Section from selection or ancestor of selection
            const firstSel = selectedIds[0];
            if (!firstSel) return null;
            const getNode = (list: PageComponent[], id: string): PageComponent | null => {
              for (const n of list) {
                if (n.id === id) return n;
                const kids = (n as any).children as PageComponent[] | undefined;
                if (Array.isArray(kids)) {
                  const found = getNode(kids, id);
                  if (found) return found;
                }
              }
              return null;
            };
            let node = getNode(components, firstSel);
            // climb ancestors until Section or root
            while (node && (node as any).type !== "Section") {
              const parent = getParentOfId(components, node.id);
              if (!parent) break;
              node = parent;
            }
            if (!node || (node as any).type !== "Section") return null;
            const sec: any = node;
            if (viewport === "desktop" && sec.contentWidthDesktop) return sec.contentWidthDesktop as string;
            if (viewport === "tablet" && sec.contentWidthTablet) return sec.contentWidthTablet as string;
            if (viewport === "mobile" && sec.contentWidthMobile) return sec.contentWidthMobile as string;
            return (sec.contentWidth as string | null) ?? null;
          })()}
          contentAlign={(function () {
            const firstSel = selectedIds[0];
            if (!firstSel) return "center";
            const getNode = (list: PageComponent[], id: string): PageComponent | null => {
              for (const n of list) {
                if (n.id === id) return n;
                const kids = (n as any).children as PageComponent[] | undefined;
                if (Array.isArray(kids)) {
                  const found = getNode(kids, id);
                  if (found) return found;
                }
              }
              return null;
            };
            let node = getNode(components, firstSel);
            while (node && (node as any).type !== "Section") {
              const parent = getParentOfId(components, node.id);
              if (!parent) break;
              node = parent;
            }
            if (!node || (node as any).type !== "Section") return "center";
            const sec: any = node;
            if (viewport === "desktop" && sec.contentAlignDesktop) return sec.contentAlignDesktop as any;
            if (viewport === "tablet" && sec.contentAlignTablet) return sec.contentAlignTablet as any;
            if (viewport === "mobile" && sec.contentAlignMobile) return sec.contentAlignMobile as any;
            return (sec.contentAlign as any) ?? "center";
          })()}
          contentAlignBase={(function () {
            const firstSel = selectedIds[0];
            if (!firstSel) return "center";
            const getNode = (list: PageComponent[], id: string): PageComponent | null => {
              for (const n of list) {
                if (n.id === id) return n;
                const kids = (n as any).children as PageComponent[] | undefined;
                if (Array.isArray(kids)) {
                  const found = getNode(kids, id);
                  if (found) return found;
                }
              }
              return null;
            };
            let node = getNode(components, firstSel);
            while (node && (node as any).type !== "Section") {
              const parent = getParentOfId(components, (node as any).id);
              if (!parent) break;
              node = parent;
            }
            if (!node || (node as any).type !== "Section") return "center";
            const sec: any = node;
            return (sec.contentAlign as any) ?? "center";
          })()}
          contentAlignSource={(function () {
            const firstSel = selectedIds[0];
            if (!firstSel) return "base" as const;
            const getNode = (list: PageComponent[], id: string): PageComponent | null => {
              for (const n of list) {
                if (n.id === id) return n;
                const kids = (n as any).children as PageComponent[] | undefined;
                if (Array.isArray(kids)) {
                  const found = getNode(kids, id);
                  if (found) return found;
                }
              }
              return null;
            };
            let node = getNode(components, firstSel);
            while (node && (node as any).type !== "Section") {
              const parent = getParentOfId(components, (node as any).id);
              if (!parent) break;
              node = parent;
            }
            if (!node || (node as any).type !== "Section") return "base" as const;
            const sec: any = node;
            if (viewport === "desktop" && sec.contentAlignDesktop) return "desktop" as const;
            if (viewport === "tablet" && sec.contentAlignTablet) return "tablet" as const;
            if (viewport === "mobile" && sec.contentAlignMobile) return "mobile" as const;
            return "base" as const;
          })()}
        />
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
              const leftKey =
                viewport === "desktop"
                  ? "leftDesktop"
                  : viewport === "tablet"
                    ? "leftTablet"
                    : "leftMobile";
              const topKey =
                viewport === "desktop"
                  ? "topDesktop"
                  : viewport === "tablet"
                    ? "topTablet"
                    : "topMobile";
              const allowed = new Set(unlockedIds);
              Object.entries(patches).forEach(([id, p]) => {
                if (!allowed.has(id)) return;
                if (!p) return;
                const patch: Record<string, string | undefined> = {};
                if (p.left !== undefined) patch[leftKey] = p.left;
                if (p.top !== undefined) patch[topKey] = p.top;
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
          <div key={c.id} className="relative group">
            {/* Inline insert control before each item */}
            <InlineInsert
              index={i}
              context="top"
              onInsert={(component, index) => {
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component, index: insertAt });
                onSelectIds([component.id]);
                // Announce for a11y
                try {
                  window.dispatchEvent(
                    new CustomEvent("pb-live-message", { detail: "Block inserted" })
                  );
                } catch {}
              }}
            />
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
                // Move focus to the selected block for predictable keyboard flow
                setTimeout(() => {
                  const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
                  el?.focus?.();
                }, 0);
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
          </div>
        ))}
        {/* Inline insert control at the end */}
        <InlineInsert
          index={visibleComponents.length}
          context="top"
          onInsert={(component, index) => {
            const insertAt = toUnderlyingIndex(index);
            dispatch({ type: "add", component, index: insertAt });
            onSelectIds([component.id]);
            try {
              window.dispatchEvent(
                new CustomEvent("pb-live-message", { detail: "Block inserted" })
              );
            } catch {}
          }}
        />
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
