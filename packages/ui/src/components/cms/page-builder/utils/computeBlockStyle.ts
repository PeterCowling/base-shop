import { CSS } from "@dnd-kit/utilities";

type DockX = "left" | "right" | "center" | undefined;
type DockY = "top" | "bottom" | "center" | undefined;

export type ComputeBlockStyleArgs = {
  transform: Parameters<typeof CSS.Transform.toString>[0] | null;
  zIndex?: number;
  // Container queries
  containerType?: string;
  containerName?: string;
  // Box model
  widthVal?: string | number;
  heightVal?: string | number;
  marginVal?: string | number;
  paddingVal?: string | number;
  // Positioning
  position?: string;
  leftVal?: string | number;
  topVal?: string | number;
  dockX?: DockX;
  dockY?: DockY;
};

/**
 * Compute the inline style for a page-builder block container.
 * Mirrors the previous in-file style logic in BlockItem to keep behavior.
 */
export function computeBlockStyle({
  transform,
  zIndex,
  containerType,
  containerName,
  widthVal,
  heightVal,
  marginVal,
  paddingVal,
  position,
  leftVal,
  topVal,
  dockX,
  dockY,
}: ComputeBlockStyleArgs): Record<string, any> {
  const style: Record<string, any> = {
    transform: CSS.Transform.toString(transform),
  };

  if (zIndex !== undefined) style.zIndex = zIndex as number;

  // Container queries
  if (containerType) style.containerType = containerType as any;
  if (containerName) style.containerName = containerName as any;

  if (widthVal) style.width = widthVal;
  if (heightVal) style.height = heightVal;
  if (marginVal) style.margin = marginVal;
  if (paddingVal) style.padding = paddingVal;

  if (position) style.position = position;

  // Docking/positioning
  const pos: Record<string, any> = {};
  if (position === "absolute") {
    // Horizontal docking
    if (dockX === "right") {
      // If explicit right is provided via overrides, upstream sets it on the component.
      // Otherwise, we intentionally avoid computing derived right at render time.
      // BlockItem previously left this as a possible future enhancement.
    } else if (dockX === "center") {
      pos.left = 0;
      pos.right = 0;
      pos.marginLeft = "auto";
      pos.marginRight = "auto";
    } else {
      if (leftVal) pos.left = leftVal;
    }
    // Vertical docking
    if (dockY === "bottom") {
      // Similar to right docking, respect explicit bottom if provided upstream.
    } else if (dockY === "center") {
      pos.top = 0;
      pos.bottom = 0;
      pos.marginTop = "auto";
      pos.marginBottom = "auto";
    } else {
      if (topVal) pos.top = topVal;
    }
  } else {
    if (topVal) pos.top = topVal;
    if (leftVal) pos.left = leftVal;
  }

  return { ...style, ...pos };
}

