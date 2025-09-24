"use client";

import { memo } from "react";
import useBlockItemMetadata from "./useBlockItemMetadata";
import useBlockItemInlineEditing from "./useBlockItemInlineEditing";
import useBlockItemInteractions from "./useBlockItemInteractions";
import useBlockItemStyles from "./useBlockItemStyles";
import useBlockItemContextMenu from "./useBlockItemContextMenu";
import BlockContent from "./BlockContent";
import BlockResizer from "./BlockResizer";
import BlockChildren from "./BlockChildren";
import CanvasOverlays from "./CanvasOverlays";
import DeleteButton from "./DeleteButton";
import DragHandle from "./DragHandle";
import HiddenBadge from "./HiddenBadge";
import ImageEditingOverlays from "./ImageEditingOverlays";
import ContextMenu from "./ContextMenu";
import ZIndexMenu from "./ZIndexMenu";
import buildBlockKeyDownHandler from "./buildBlockKeyDownHandler";
import { LockClosedIcon } from "@radix-ui/react-icons";

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
  dropAllowed,
  insertParentId,
  insertIndex,
  preferParentOnClick = false,
}: Props) {
  const { selected, flags, effLocked, effZIndex, hiddenList, isHiddenHere } = useBlockItemMetadata({
    component,
    selectedIds,
    editor,
    viewport,
  });

  const { isInlineEditableButton, inline } = useBlockItemInlineEditing(component);

  const { dnd, dimensions, resize, drag, spacing, rotate, overlay } = useBlockItemInteractions({
    component,
    index,
    parentId,
    dispatch,
    gridEnabled,
    gridCols,
    effLocked: !!effLocked,
    inlineEditing: !!inline?.editing,
    baselineSnap,
    baselineStep,
    zoom,
    viewport,
  });

  const style = useBlockItemStyles({
    component,
    parentId,
    flags: flags as Record<string, unknown>,
    effZIndex: effZIndex as number | undefined,
    transform: dnd.transform,
    dimensions: {
      widthVal: dimensions.widthVal,
      heightVal: dimensions.heightVal,
      marginVal: dimensions.marginVal,
      paddingVal: dimensions.paddingVal,
      leftVal: dimensions.leftVal,
      topVal: dimensions.topVal,
    },
  });

  const { ctxItems, ctxOpen, ctxPos, openContextMenu, closeContextMenu } = useBlockItemContextMenu({
    component,
    effLocked: !!effLocked,
    flags: flags as Record<string, unknown>,
    selectedIds,
    editor,
    dispatch,
    onRemove,
  });

  const selectableId = preferParentOnClick && parentId ? parentId : component.id;
  const childComponents = (component as any).children as any;

  return (
    <div
      ref={dnd.setNodeRef}
      onClick={(event) => onSelect(selectableId, event)}
      onContextMenu={(event) => {
        onSelect(selectableId, event);
        openContextMenu(event);
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
        containerRef: dnd.containerRef as any,
        gridEnabled: !!gridEnabled,
        gridCols,
        nudgeSpacingByKeyboard: spacing.nudgeSpacingByKeyboard,
        nudgeResizeByKeyboard: resize.nudgeByKeyboard,
        parentSlots,
        parentType,
        currSlotKey: (component as any).slotKey as any,
        componentId: component.id,
        dispatch,
        viewport,
      })}
      style={style}
      className={
        "hover:border-primary relative rounded border hover:border-dashed" +
        (selected ? " ring-2 ring-blue-500" : "") +
        (overlay.snapping ? " border-primary" : "") +
        (dnd.isOver || dnd.isDragging
          ? dropAllowed === false
            ? " border-danger border-dashed cursor-not-allowed"
            : " border-primary border-dashed"
          : "")
      }
    >
      <DragHandle
        attributes={dnd.attributes}
        listeners={dnd.listeners}
        isDragging={dnd.isDragging}
        locked={!!effLocked}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(component.id, event);
          if (!effLocked && component.position === "absolute") {
            drag.startDrag(event);
          }
        }}
      />
      {effLocked && (
        <div className="absolute right-1 top-1 z-30 text-xs" title="Locked" aria-hidden>
          <LockClosedIcon />
        </div>
      )}
      <CanvasOverlays
        guides={overlay.guides}
        distances={overlay.distances}
        spacingOverlay={spacing.overlay ?? null}
        showSizePosition={overlay.showOverlay}
        overlayWidth={overlay.overlayWidth}
        overlayHeight={overlay.overlayHeight}
        overlayLeft={overlay.overlayLeft}
        overlayTop={overlay.overlayTop}
        rotating={rotate.rotating}
        angle={rotate.angle}
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
        startResize={(event) => {
          if (!effLocked) {
            resize.startResize(event);
          }
        }}
        startSpacing={(event, type, side) => {
          if (!effLocked) {
            spacing.startSpacing(event, type, side);
          }
        }}
        startRotate={(event) => {
          if (!effLocked) {
            rotate.startRotate(event);
          }
        }}
      />
      <DeleteButton locked={!!effLocked} onRemove={onRemove} />
      <ZIndexMenu
        componentId={component.id}
        currentZ={(flags as any).zIndex as number | undefined}
        dispatch={dispatch}
      />
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
        isOver={dnd.isOver}
        setDropRef={dnd.setDropRef}
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
      <ContextMenu x={ctxPos.x} y={ctxPos.y} open={ctxOpen} onClose={closeContextMenu} items={ctxItems} />
    </div>
  );
});

export default BlockItem;
