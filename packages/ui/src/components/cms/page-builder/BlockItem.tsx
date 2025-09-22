"use client";

// types consumed via Props
import { memo, useMemo, useState } from "react";
import useInlineText from "./useInlineText";
import BlockContent from "./BlockContent";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import useCanvasSpacing from "./useCanvasSpacing";
import useBlockDimensions from "./useBlockDimensions";
import useBlockDnD from "./useBlockDnD";
import BlockResizer from "./BlockResizer";
import BlockChildren from "./BlockChildren";
import useCanvasRotate from "./useCanvasRotate";
import { LockClosedIcon } from "@radix-ui/react-icons";
import ContextMenu from "./ContextMenu";
import ImageEditingOverlays from "./ImageEditingOverlays";
import { isHiddenForViewport } from "./state/layout/utils";
import { computeBlockStyle } from "./utils/computeBlockStyle";
import CanvasOverlays from "./CanvasOverlays";
import ZIndexMenu from "./ZIndexMenu";
import HiddenBadge from "./HiddenBadge";
import DragHandle from "./DragHandle";
import buildBlockContextMenuItems from "./buildBlockContextMenuItems";
import buildBlockKeyDownHandler from "./buildBlockKeyDownHandler";
import DeleteButton from "./DeleteButton";

import type { BlockItemProps as Props } from "./BlockItem.types";

const BlockItem = memo(function BlockItemComponent({
  component,
  index,
  parentId,
  selectedIds,
  parentType,
  parentSlots,
  onSelect,
  onRemove,
  dispatch,
  locale,
  gridEnabled = false,
  gridCols,
  viewport,
  device,
  editor,
  zoom = 1,
  baselineSnap = false,
  baselineStep = 8,
  // not destructured earlier; used further below
  dropAllowed,
  insertParentId,
  insertIndex,
  preferParentOnClick = false,
}: Props) {
  const selected = selectedIds.includes(component.id);
  const flags = useMemo(() => ((editor ?? {})[component.id] ?? {}), [editor, component.id]);
  const effLocked = (flags as any).locked ?? (component as any).locked ?? false;
  const effZIndex = (flags as any).zIndex ?? (component as any).zIndex;
  const hiddenList = ((editor ?? {})[component.id]?.hidden ?? []) as ("desktop"|"tablet"|"mobile")[];
  const isHiddenHere = isHiddenForViewport(component.id, editor, (component as any).hidden as boolean | undefined, viewport);
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

  const isInlineEditableButton = component.type === "Button";
  const inlineAll = useInlineText(component as any, "label") as ReturnType<typeof useInlineText<any, any>>;
  const inline = isInlineEditableButton ? inlineAll : null;

  const {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    leftKey,
    topKey,
    leftVal,
    topVal,
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
    kbResizing,
    nudgeByKeyboard: nudgeResizeByKeyboard,
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
    disabled: !!effLocked || !!inline?.editing,
    leftKey,
    topKey,
    dockX: (component as any).dockX as any,
    dockY: (component as any).dockY as any,
    zoom,
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
    disabled: !!effLocked || !!inline?.editing,
    leftKey,
    topKey,
    dockX: (component as any).dockX as any,
    dockY: (component as any).dockY as any,
    zoom,
  });

  const { startSpacing, overlay: spacingOverlay, nudgeSpacingByKeyboard } = useCanvasSpacing({
    componentId: component.id,
    marginKey,
    paddingKey,
    marginVal,
    paddingVal,
    dispatch,
    containerRef,
    baselineSnap,
    baselineStep,
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

  const showOverlay = resizing || moving || kbResizing;
  const overlayWidth = resizing ? resizeWidth : dragWidth;
  const overlayHeight = resizing ? resizeHeight : dragHeight;
  const overlayLeft = resizing ? resizeLeft : dragLeft;
  const overlayTop = resizing ? resizeTop : dragTop;
  const childComponents = (component as any).children as any;

  // Rotation
  const { startRotate, rotating, angle } = useCanvasRotate({
    componentId: component.id,
    styles: (component as any).styles as string | undefined,
    dispatch,
    containerRef,
    zoom,
  });

  // Context menu state
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const ctxItems = useMemo(
    () =>
      buildBlockContextMenuItems({
        componentId: component.id,
        componentStyles: component.styles as any,
        effLocked,
        flagsZIndex: (flags as any).zIndex as number | undefined,
        selectedIds,
        editor,
        dispatch,
        onRemove,
      }),
    [component.id, component.styles, dispatch, editor, effLocked, flags, onRemove, selectedIds]
  );

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => onSelect((preferParentOnClick && parentId ? parentId : component.id), e)}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelect((preferParentOnClick && parentId ? parentId : component.id), e);
        setCtxPos({ x: e.clientX, y: e.clientY });
        setCtxOpen(true);
      }}
      role="listitem"
      aria-label="Canvas item"
      tabIndex={0}
      id={(component as any).anchorId || undefined}
      data-component-id={component.id}
      data-pb-contextmenu-trigger
      onKeyDown={buildBlockKeyDownHandler({
        locked: !!effLocked,
        inlineEditing: !!inline?.editing,
        containerRef: containerRef as any,
        gridEnabled: !!gridEnabled,
        gridCols,
        nudgeSpacingByKeyboard,
        nudgeResizeByKeyboard,
        parentSlots,
        parentType,
        currSlotKey: (component as any).slotKey as any,
        componentId: component.id,
        dispatch,
        viewport,
      })}
      style={{
        ...computeBlockStyle({
          transform,
          zIndex: effZIndex as number | undefined,
          containerType: (component as any).containerType as string | undefined,
          containerName: (component as any).containerName as string | undefined,
          widthVal,
          heightVal,
          marginVal,
          paddingVal,
          position: component.position,
          leftVal,
          topVal,
          dockX: (component as any).dockX as any,
          dockY: (component as any).dockY as any,
          responsiveBehavior: (flags as any)?.responsiveBehavior as any,
        }),
        // Pin to top (sticky) for top-level globals when flagged in editor
        ...(function() {
          const isTopLevel = !parentId;
          const pinned = !!(flags as any)?.pinned;
          if (!isTopLevel || !pinned) return {};
          return { position: 'sticky', top: 0, zIndex: 30 } as const;
        })(),
        // Custom cursor support
        ...(function() {
          const cur = (component as any).cursor as string | undefined;
          const url = (component as any).cursorUrl as string | undefined;
          if (!cur || cur === 'default') return {};
          if (cur === 'custom' && url) return { cursor: `url(${url}), auto` } as const;
          return { cursor: cur } as const;
        })(),
      }}
      className={
        "hover:border-primary relative rounded border hover:border-dashed" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (snapping ? " border-primary" : "") +
        (isOver || isDragging
          ? (dropAllowed === false ? " border-danger border-dashed cursor-not-allowed" : " border-primary border-dashed")
          : "")
      }
    >
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
        locked={!!effLocked}
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(component.id, e);
          if (!effLocked && component.position === "absolute") startDrag(e);
        }}
      />
      {effLocked && (
        <div className="absolute right-1 top-1 z-30 text-xs" title="Locked" aria-hidden>
          <LockClosedIcon />
        </div>
      )}
      <CanvasOverlays
        guides={guides}
        distances={distances}
        spacingOverlay={spacingOverlay ?? null}
        showSizePosition={showOverlay}
        overlayWidth={overlayWidth}
        overlayHeight={overlayHeight}
        overlayLeft={overlayLeft}
        overlayTop={overlayTop}
        rotating={rotating}
        angle={angle}
      />
      <BlockContent
        component={{
          ...component,
          pbViewport: viewport,
        } as any}
        locale={locale}
        isInlineEditableButton={isInlineEditableButton}
        inline={inline as any}
        dispatch={dispatch as any}
      />
      <ImageEditingOverlays enabled={selected && !effLocked} component={component} dispatch={dispatch} />
      
      <BlockResizer
        selected={selected}
        startResize={(e) => {
          if (!effLocked) startResize(e);
        }}
        startSpacing={(e, type, side) => {
          if (!effLocked) startSpacing(e, type, side);
        }}
        startRotate={(e) => {
          if (!effLocked) startRotate(e);
        }}
      />
      <DeleteButton locked={!!effLocked} onRemove={onRemove} />
      <ZIndexMenu componentId={component.id} currentZ={(flags as any).zIndex as number | undefined} dispatch={dispatch} />
      <BlockChildren
        component={component}
        childComponents={childComponents}
        selectedIds={selectedIds}
        onSelect={onSelect}
        dispatch={dispatch}
        locale={locale}
        gridEnabled={gridEnabled}
        gridCols={gridCols}
        viewport={viewport}
        device={device}
        isOver={isOver}
        setDropRef={setDropRef}
        baselineSnap={baselineSnap}
        baselineStep={baselineStep}
        dropAllowed={dropAllowed}
        insertParentId={insertParentId as any}
        insertIndex={insertIndex as any}
        editor={editor}
        preferParentOnClick={preferParentOnClick}
      />
      <HiddenBadge
        hiddenList={hiddenList}
        isHiddenHere={isHiddenHere}
        viewport={viewport}
        componentId={component.id}
        editor={editor}
        dispatch={dispatch}
      />
      <ContextMenu
        x={ctxPos.x}
        y={ctxPos.y}
        open={ctxOpen}
        onClose={() => setCtxOpen(false)}
        items={ctxItems}
      />
    </div>
  );
});

export default BlockItem;
