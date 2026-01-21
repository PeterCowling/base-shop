"use client";

import { memo } from "react";
import { LockClosedIcon } from "@radix-ui/react-icons";

import { useTranslations } from "@acme/i18n";

import BlockChildren from "./BlockChildren";
import BlockContent from "./BlockContent";
import type { BlockItemProps as Props } from "./BlockItem.types";
import BlockResizer from "./BlockResizer";
import buildBlockKeyDownHandler from "./buildBlockKeyDownHandler";
import CanvasOverlays from "./CanvasOverlays";
import ContextMenu from "./ContextMenu";
import DeleteButton from "./DeleteButton";
import DragHandle from "./DragHandle";
import HiddenBadge from "./HiddenBadge";
import ImageEditingOverlays from "./ImageEditingOverlays";
import useBlockItemContextMenu from "./useBlockItemContextMenu";
import useBlockItemInlineEditing from "./useBlockItemInlineEditing";
import useBlockItemInteractions from "./useBlockItemInteractions";
import useBlockItemMetadata from "./useBlockItemMetadata";
import useBlockItemStyles from "./useBlockItemStyles";
import ZIndexMenu from "./ZIndexMenu";

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
  const t = useTranslations();
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
  const childComponents = (component as { children?: import("@acme/types").PageComponent[] }).children;

  // Compose wrapper class (utility classes only) outside JSX to avoid i18n rule noise.
  const wrapperClass =
     
    "hover:border-primary relative rounded border hover:border-dashed" +
     
    (selected ? " ring-2 ring-blue-500" : "") +
     
    (overlay.snapping ? " border-primary" : "") +
    (dnd.isOver || dnd.isDragging
      ? dropAllowed === false
         
        ? " border-danger border-dashed cursor-not-allowed"
         
        : " border-primary border-dashed"
      : "");

  return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- PB-2461: Canvas item must handle click/contextmenu/keyboard to support selection & DnD
      <div
      ref={dnd.setNodeRef}
      onClick={(event) => onSelect(selectableId, event)}
      onContextMenu={(event) => {
        onSelect(selectableId, event);
        openContextMenu(event);
      }}
      role="listitem"
      aria-label={t("Canvas item") as string}
      tabIndex={0}
      id={(component as { anchorId?: string }).anchorId || undefined}
      data-component-id={component.id}
      data-pb-contextmenu-trigger
      onKeyDown={buildBlockKeyDownHandler({
        locked: !!effLocked,
        inlineEditing: !!inline?.editing,
        containerRef: dnd.containerRef,
        gridEnabled: !!gridEnabled,
        gridCols,
        nudgeSpacingByKeyboard: spacing.nudgeSpacingByKeyboard,
        nudgeResizeByKeyboard: resize.nudgeByKeyboard,
        parentSlots,
        parentType,
        currSlotKey: (component as { slotKey?: string }).slotKey,
        componentId: component.id,
        dispatch,
        viewport,
        t: t as unknown as (key: string, vars?: Record<string, unknown>) => string,
      })}
      /* eslint-disable-next-line react/forbid-dom-props -- PB-2419: editor canvas item uses dynamic inline positioning/transforms during interactions */
      style={style}
      className={wrapperClass}
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
        // eslint-disable-next-line ds/absolute-parent-guard -- PB-2460: Positioned under relative parent; rule mis-detects due to dynamic class concatenation.
        <div className="absolute end-1 top-1 text-xs" title={t("Locked") as string} aria-hidden>
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
        } as import("@acme/types").PageComponent & { pbViewport?: "desktop" | "tablet" | "mobile" }}
        locale={locale}
        isInlineEditableButton={isInlineEditableButton}
        inline={inline}
        dispatch={dispatch}
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
        currentZ={effZIndex as number | undefined}
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
        insertParentId={insertParentId}
        insertIndex={insertIndex}
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
