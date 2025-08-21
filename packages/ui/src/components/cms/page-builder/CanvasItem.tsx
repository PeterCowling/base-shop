"use client";

import type { Locale } from "@acme/i18n/locales";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent, TextComponent } from "@acme/types";
import { memo, useRef } from "react";
import type { Action } from "./state";
import Block from "./Block";
import TextBlock from "./TextBlock";
import useSortableBlock from "./useSortableBlock";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import useCanvasSpacing from "./useCanvasSpacing";
import type { DevicePreset } from "../../../utils/devicePresets";

type Props = {
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
};

const CanvasItem = memo(function CanvasItemComponent({
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
}: Props) {
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
  const widthVal =
    (component[widthKey as keyof PageComponent] as string | undefined) ??
    component.width;
  const heightVal =
    (component[heightKey as keyof PageComponent] as string | undefined) ??
    component.height;
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
  const marginVal =
    (component[marginKey as keyof PageComponent] as string | undefined) ??
    component.margin;
  const paddingVal =
    (component[paddingKey as keyof PageComponent] as string | undefined) ??
    component.padding;

  const {
    startResize,
    guides: resizeGuides,
    distances: resizeDistances,
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
    distances: dragDistances,
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

  const { startSpacing, overlay: spacingOverlay } = useCanvasSpacing({
    componentId: component.id,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    dispatch,
    containerRef,
  });

  const guides =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeGuides
      : dragGuides;
  const distances =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeDistances
      : dragDistances;
  const snapping = resizeSnapping || dragSnapping;

  const showOverlay = resizing || moving;
  const overlayWidth = resizing ? resizeWidth : dragWidth;
  const overlayHeight = resizing ? resizeHeight : dragHeight;
  const overlayLeft = resizing ? resizeLeft : dragLeft;
  const overlayTop = resizing ? resizeTop : dragTop;

  const children = (component as { children?: PageComponent[] }).children;
  const hasChildren = Array.isArray(children);
  const childIds = hasChildren ? children!.map((c) => c.id) : [];

  if (component.type === "Text") {
    return (
      <TextBlock
        component={component as TextComponent}
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
        "hover:border-primary relative rounded border hover:border-dashed" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (snapping ? " border-primary" : "") +
        (isOver || isDragging ? " border-primary border-dashed" : "")
      }
    >
      <div
        className="bg-muted absolute top-0 left-0 z-10 h-3 w-3 cursor-move"
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
      <div className="pointer-events-none absolute inset-0 z-20">
        <div
          className="bg-primary absolute top-0 bottom-0 w-px transition-opacity duration-150"
          style={{ left: guides.x ?? 0, opacity: guides.x !== null ? 1 : 0 }}
        />
        {distances.x !== null && (
          <div
            className="absolute -top-4 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow transition-opacity duration-150 dark:bg-white/75 dark:text-black"
            style={{
              left: (guides.x ?? 0) + 4,
              opacity: guides.x !== null ? 1 : 0,
            }}
          >
            {Math.round(distances.x)}
          </div>
        )}
        <div
          className="bg-primary absolute right-0 left-0 h-px transition-opacity duration-150"
          style={{ top: guides.y ?? 0, opacity: guides.y !== null ? 1 : 0 }}
        />
        {distances.y !== null && (
          <div
            className="absolute -left-4 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow transition-opacity duration-150 dark:bg-white/75 dark:text-black"
            style={{
              top: (guides.y ?? 0) + 4,
              opacity: guides.y !== null ? 1 : 0,
            }}
          >
            {Math.round(distances.y)}
          </div>
        )}
      </div>
      <Block component={component} locale={locale} />
      {spacingOverlay && (
        <div
          className="bg-primary/20 pointer-events-none absolute z-30"
          style={{
            top: spacingOverlay.top,
            left: spacingOverlay.left,
            width: spacingOverlay.width,
            height: spacingOverlay.height,
          }}
        />
      )}
      {showOverlay && (
        <div className="pointer-events-none absolute -top-5 left-0 z-30 rounded bg-black/75 px-1 font-mono text-[10px] text-white shadow dark:bg-white/75 dark:text-black">
          {Math.round(overlayWidth)}×{Math.round(overlayHeight)} |{" "}
          {Math.round(overlayLeft)}, {Math.round(overlayTop)}
        </div>
      )}
      {selected && (
        <>
          <div
            onPointerDown={startResize}
            className="bg-primary absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize"
          />
          <div
            onPointerDown={startResize}
            className="bg-primary absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize"
          />
          <div
            onPointerDown={startResize}
            className="bg-primary absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize"
          />
          <div
            onPointerDown={startResize}
            className="bg-primary absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "margin", "top")}
            className="bg-primary absolute -top-2 left-1/2 h-1 w-4 -translate-x-1/2 cursor-n-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "margin", "bottom")}
            className="bg-primary absolute -bottom-2 left-1/2 h-1 w-4 -translate-x-1/2 cursor-s-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "margin", "left")}
            className="bg-primary absolute top-1/2 -left-2 h-4 w-1 -translate-y-1/2 cursor-w-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "margin", "right")}
            className="bg-primary absolute top-1/2 -right-2 h-4 w-1 -translate-y-1/2 cursor-e-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "padding", "top")}
            className="bg-primary absolute top-0 left-1/2 h-1 w-4 -translate-x-1/2 cursor-n-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "padding", "bottom")}
            className="bg-primary absolute bottom-0 left-1/2 h-1 w-4 -translate-x-1/2 cursor-s-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "padding", "left")}
            className="bg-primary absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 cursor-w-resize"
          />
          <div
            onPointerDown={(e) => startSpacing(e, "padding", "right")}
            className="bg-primary absolute top-1/2 right-0 h-4 w-1 -translate-y-1/2 cursor-e-resize"
          />
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="bg-danger absolute top-1 right-1 rounded px-2 text-xs"
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
            className="border-muted m-2 flex flex-col gap-4 border border-dashed p-2"
          >
            {isOver && (
              <div
                data-placeholder
                className="border-primary bg-primary/10 ring-primary h-4 w-full rounded border-2 border-dashed ring-2"
              />
            )}
            {children!.map((child: PageComponent, i: number) => (
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
      )}
    </div>
  );
});

export default CanvasItem;
