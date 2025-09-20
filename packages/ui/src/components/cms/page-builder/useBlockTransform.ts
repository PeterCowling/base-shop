"use client";

import type { RefObject } from "react";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
import type { Action } from "./state";

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
  });

  const guides =
    resizeGuides.x !== null || resizeGuides.y !== null
      ? resizeGuides
      : dragGuides;
  const snapping = resizeSnapping || dragSnapping;

  return { startResize, startDrag, guides, snapping, nudgeByKeyboard, kbResizing } as const;
}
