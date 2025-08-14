"use client";

import type { Locale } from "@/i18n/locales";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent } from "@acme/types";
import { memo, useRef } from "react";
import type { Action } from "./state";
import Block from "./Block";
import TextBlock from "./TextBlock";
import useSortableBlock from "./useSortableBlock";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import type { DevicePreset } from "@ui/utils/devicePresets";

const CanvasItem = memo(function CanvasItem({
  component,
  index,
  parentId,
  selectedId,
  onSelectId,
  onRemove,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
  device,
}: {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
  selectedId: string | null;
  onSelectId: (id: string) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
}) {
  if (component.type === "Text") {
    return (
      <TextBlock
        component={component}
        index={index}
        parentId={parentId}
        selectedId={selectedId}
        onSelectId={onSelectId}
        onRemove={onRemove}
        dispatch={dispatch}
        locale={locale}
        gridEnabled={gridEnabled}
        gridCols={gridCols}
        viewport={viewport}
      />
    );
  }

  const selected = selectedId === component.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    setDropRef,
    isOver,
  } = useSortableBlock(component.id, index, parentId);

  const containerRef = useRef<HTMLDivElement>(null);

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
  const widthVal = (component as any)[widthKey] ?? component.width;
  const heightVal = (component as any)[heightKey] ?? component.height;
  const marginKey =
    viewport === "desktop"
      ? "marginDesktop"
      : viewport === "tablet"
      ? "marginTablet"
      : "marginMobile";
  const paddingKey =
    viewport === "desktop"
      ? "paddingDesktop"
      : viewport === "tablet"
      ? "paddingTablet"
      : "paddingMobile";
  const marginVal = (component as any)[marginKey] ?? component.margin;
  const paddingVal = (component as any)[paddingKey] ?? component.padding;

  const {
    startResize,
    guides: resizeGuides,
    snapping: resizeSnapping,
    width: resizeWidth,
    height: resizeHeight,
    left: resizeLeft,
    top: resizeTop,
    resizing,
  } = useCanvasResize({
    componentId: component.id,
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
  });

  const {
    startDrag,
    guides: dragGuides,
    snapping: dragSnapping,
    width: dragWidth,
    height: dragHeight,
    left: dragLeft,
    top: dragTop,
    moving,
  } = useCanvasDrag({
    componentId: component.id,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
  });

  const guides =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeGuides
      : dragGuides;
  const snapping = resizeSnapping || dragSnapping;

  const showOverlay = resizing || moving;
  const overlayWidth = resizing ? resizeWidth : dragWidth;
  const overlayHeight = resizing ? resizeHeight : dragHeight;
  const overlayLeft = resizing ? resizeLeft : dragLeft;
  const overlayTop = resizing ? resizeTop : dragTop;

  const hasChildren = Array.isArray((component as any).children);
  const childIds = hasChildren
    ? ((component as any).children as PageComponent[]).map((c) => c.id)
    : [];

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      onClick={() => onSelectId(component.id)}
      role="listitem"
      aria-grabbed={isDragging}
      aria-dropeffect="move"
      tabIndex={0}
      style={{
        transform: CSS.Transform.toString(transform),
        ...(widthVal ? { width: widthVal } : {}),
        ...(heightVal ? { height: heightVal } : {}),
        ...(marginVal ? { margin: marginVal } : {}),
        ...(paddingVal ? { padding: paddingVal } : {}),
        ...(component.position ? { position: component.position } : {}),
        ...(component.top ? { top: component.top } : {}),
        ...(component.left ? { left: component.left } : {}),
      }}
      className={
        "relative rounded border hover:border-dashed hover:border-primary" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (snapping ? " border-primary" : "") +
        ((isOver || isDragging) ? " border-dashed border-primary" : "")
      }
    >
      <div
        className="absolute left-0 top-0 z-10 h-3 w-3 cursor-move bg-muted"
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-grabbed={isDragging}
        title="Drag or press space/enter to move"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelectId(component.id);
          if (component.position === "absolute") startDrag(e);
        }}
      />
      {(guides.x !== null || guides.y !== null) && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {guides.x !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-primary"
              style={{ left: guides.x }}
            />
          )}
          {guides.y !== null && (
            <div
              className="absolute left-0 right-0 h-px bg-primary"
              style={{ top: guides.y }}
            />
          )}
        </div>
      )}
      <Block component={component} locale={locale} />
      {showOverlay && (
        <div className="pointer-events-none absolute -top-5 left-0 z-30 rounded bg-black/75 px-1 text-[10px] font-mono text-white shadow dark:bg-white/75 dark:text-black">
          {Math.round(overlayWidth)}×{Math.round(overlayHeight)} | {Math.round(overlayLeft)},{" "}
          {Math.round(overlayTop)}
        </div>
      )}
      {selected && (
        <>
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-primary"
          />
          <div
            onPointerDown={startResize}
            className="absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-primary"
          />
          <div
            onPointerDown={startResize}
            className="absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-primary"
          />
          <div
            onPointerDown={startResize}
            className="absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-primary"
          />
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded bg-danger px-2 text-xs"
        data-token="--color-danger"
      >
        <span className="text-danger-foreground" data-token="--color-danger-fg">
          ×
        </span>
      </button>
      {hasChildren && (
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
            className="m-2 flex flex-col gap-4 border border-dashed border-muted p-2"
          >
            {isOver && (
              <div
                data-placeholder
                className="h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10 ring-2 ring-primary"
              />
            )}
            {(component as any).children.map(
              (child: PageComponent, i: number) => (
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
              )
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
});

export default CanvasItem;
