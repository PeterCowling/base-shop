"use client";

import { useMemo } from "react";
import useBlockDnD from "./useBlockDnD";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import useCanvasSpacing from "./useCanvasSpacing";
import useBlockDimensions from "./useBlockDimensions";
import useCanvasRotate from "./useCanvasRotate";
import type { BlockItemProps } from "./BlockItem.types";

type Props = BlockItemProps;

type Options = {
  component: Props["component"];
  index: Props["index"];
  parentId: Props["parentId"];
  dispatch: Props["dispatch"];
  gridEnabled?: Props["gridEnabled"];
  gridCols: Props["gridCols"];
  effLocked: boolean;
  inlineEditing: boolean;
  baselineSnap?: Props["baselineSnap"];
  baselineStep?: Props["baselineStep"];
  zoom?: Props["zoom"];
  viewport: Props["viewport"];
};

export default function useBlockItemInteractions({
  component,
  index,
  parentId,
  dispatch,
  gridEnabled = false,
  gridCols,
  effLocked,
  inlineEditing,
  baselineSnap = false,
  baselineStep = 8,
  zoom = 1,
  viewport,
}: Options) {
  const dnd = useBlockDnD(component.id, index, parentId);

  const dimensions = useBlockDimensions({ component, viewport });

  const resize = useCanvasResize({
    componentId: component.id,
    widthKey: dimensions.widthKey,
    heightKey: dimensions.heightKey,
    widthVal: dimensions.widthVal,
    heightVal: dimensions.heightVal,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef: dnd.containerRef,
    disabled: !!effLocked || inlineEditing,
    leftKey: dimensions.leftKey,
    topKey: dimensions.topKey,
    dockX: (component as any).dockX as any,
    dockY: (component as any).dockY as any,
    zoom,
  });

  const drag = useCanvasDrag({
    componentId: component.id,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef: dnd.containerRef,
    disabled: !!effLocked || inlineEditing,
    leftKey: dimensions.leftKey,
    topKey: dimensions.topKey,
    dockX: (component as any).dockX as any,
    dockY: (component as any).dockY as any,
    zoom,
  });

  const spacing = useCanvasSpacing({
    componentId: component.id,
    marginKey: dimensions.marginKey,
    paddingKey: dimensions.paddingKey,
    marginVal: dimensions.marginVal,
    paddingVal: dimensions.paddingVal,
    dispatch,
    containerRef: dnd.containerRef,
    baselineSnap,
    baselineStep,
  });

  const rotate = useCanvasRotate({
    componentId: component.id,
    styles: (component as any).styles as string | undefined,
    dispatch,
    containerRef: dnd.containerRef,
    zoom,
  });

  const overlay = useMemo(() => {
    const usingResizeGuides = resize.guides.x !== null || resize.guides.y !== null;
    const guides = usingResizeGuides ? resize.guides : drag.guides;
    const distances = usingResizeGuides ? resize.distances : drag.distances;

    return {
      guides,
      distances,
      snapping: resize.snapping || drag.snapping,
      showOverlay: resize.resizing || drag.moving || resize.kbResizing,
      overlayWidth: resize.resizing ? resize.width : drag.width,
      overlayHeight: resize.resizing ? resize.height : drag.height,
      overlayLeft: resize.resizing ? resize.left : drag.left,
      overlayTop: resize.resizing ? resize.top : drag.top,
    } as const;
  }, [
    drag.distances,
    drag.guides,
    drag.height,
    drag.left,
    drag.moving,
    drag.snapping,
    drag.top,
    drag.width,
    resize.distances,
    resize.guides,
    resize.height,
    resize.kbResizing,
    resize.left,
    resize.resizing,
    resize.snapping,
    resize.top,
    resize.width,
  ]);

  return { dnd, dimensions, resize, drag, spacing, rotate, overlay } as const;
}
