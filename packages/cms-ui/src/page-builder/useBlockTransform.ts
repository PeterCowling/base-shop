"use client";

import type { RefObject } from "react";

import type { Action } from "./state";
import useCanvasDrag from "./useCanvasDrag";
import useCanvasResize from "./useCanvasResize";

interface Options {
  widthKey: string;
  heightKey: string;
  widthVal?: string;
  heightVal?: string;
  dispatch: React.Dispatch<Action>;
  gridEnabled?: boolean;
  gridCols: number;
  containerRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  zoom?: number;
}

export default function useBlockTransform(
  componentId: string,
  {
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    dispatch,
    gridEnabled = false,
    gridCols,
    containerRef,
    disabled = false,
    zoom = 1,
  }: Options,
) {
  const {
    startResize,
    guides: resizeGuides,
    snapping: resizeSnapping,
    nudgeByKeyboard,
    kbResizing,
  } = useCanvasResize({
    componentId,
    widthKey,
    heightKey,
    widthVal,
    heightVal,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
    disabled,
    zoom,
  });

  const {
    startDrag,
    guides: dragGuides,
    snapping: dragSnapping,
  } = useCanvasDrag({
    componentId,
    dispatch,
    gridEnabled,
    gridCols,
    containerRef,
    disabled,
    zoom,
  });

  const guides =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeGuides
      : dragGuides;
  const snapping = resizeSnapping || dragSnapping;

  return { startResize, startDrag, guides, snapping, nudgeByKeyboard, kbResizing } as const;
}
