import { snapToGrid } from "../gridSnap";

export interface SiblingEdgesRef {
  current: { vertical: number[]; horizontal: number[] };
}

export function applySnapping(
  left: number,
  top: number,
  width: number,
  height: number,
  siblingEdgesRef: SiblingEdgesRef,
  options: {
    gridEnabled: boolean;
    gridCols: number;
    parent: HTMLElement | null | undefined;
    threshold: number;
  }
) {
  let newW = width;
  let newH = height;
  let guideX: number | null = null;
  let guideY: number | null = null;
  let distX: number | null = null;
  let distY: number | null = null;

  siblingEdgesRef.current.vertical.forEach((edge) => {
    const rightDist = Math.abs(left + newW - edge);
    if (rightDist <= options.threshold && (distX === null || rightDist < distX)) {
      newW = edge - left;
      guideX = edge;
      distX = rightDist;
    }
  });

  siblingEdgesRef.current.horizontal.forEach((edge) => {
    const bottomDist = Math.abs(top + newH - edge);
    if (bottomDist <= options.threshold && (distY === null || bottomDist < distY)) {
      newH = edge - top;
      guideY = edge;
      distY = bottomDist;
    }
  });

  if (options.gridEnabled && options.parent) {
    const unit = options.parent.offsetWidth / options.gridCols;
    const snappedW = snapToGrid(newW, unit);
    const snappedH = snapToGrid(newH, unit);
    const gridDistX = Math.abs(snappedW - newW);
    const gridDistY = Math.abs(snappedH - newH);
    newW = snappedW;
    newH = snappedH;

    if (gridDistX <= options.threshold && (distX === null || gridDistX < distX)) {
      guideX = left + snappedW;
      distX = gridDistX;
    }
    if (gridDistY <= options.threshold && (distY === null || gridDistY < distY)) {
      guideY = top + snappedH;
      distY = gridDistY;
    }
  }

  return { width: newW, height: newH, guideX, guideY, distX, distY };
}

