"use client";

import type { Locale } from "@acme/i18n/locales";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent } from "@acme/types";
import { memo } from "react";
import type { Action } from "./state";
import Block from "./Block";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import useCanvasSpacing from "./useCanvasSpacing";
import useBlockDimensions from "./useBlockDimensions";
import useBlockDnD from "./useBlockDnD";
import BlockResizer from "./BlockResizer";
import BlockChildren from "./BlockChildren";
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

const BlockItem = memo(function BlockItemComponent({
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
    containerRef,
  } = useBlockDnD(component.id, index, parentId);

  const {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
  } = useBlockDimensions({ component, viewport });

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
  const childComponents = (component as { children?: PageComponent[] }).children;

  return (
    <div
      ref={setNodeRef}
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
      <BlockResizer
        selected={selected}
        startResize={startResize}
        startSpacing={startSpacing}
      />
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
      <BlockChildren
        component={component}
        childComponents={childComponents}
        selectedId={selectedId}
        onSelectId={onSelectId}
        dispatch={dispatch}
        locale={locale}
        gridEnabled={gridEnabled}
        gridCols={gridCols}
        viewport={viewport}
        device={device}
        isOver={isOver}
        setDropRef={setDropRef}
      />
    </div>
  );
});

export default BlockItem;

