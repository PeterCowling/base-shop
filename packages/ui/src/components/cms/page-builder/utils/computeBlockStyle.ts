import type { CSSProperties } from "react";
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
  // Builder-only responsive behavior flag from editor
  responsiveBehavior?: "none" | "scale-proportional";
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
  responsiveBehavior,
}: ComputeBlockStyleArgs): CSSProperties & { containerType?: string; containerName?: string } {
  const style: CSSProperties & { containerType?: string; containerName?: string } = {
    transform: CSS.Transform.toString(transform),
  };

  if (zIndex !== undefined) style.zIndex = zIndex as number;

  // Container queries
  if (containerType === "size" || containerType === "inline-size") {
    style.containerType = containerType;
  }
  if (containerName) (style as unknown as { containerName?: string }).containerName = containerName;

  if (widthVal) style.width = widthVal;
  if (heightVal) style.height = heightVal;
  if (marginVal) style.margin = marginVal;
  if (paddingVal) style.padding = paddingVal;

  if (
    position === "absolute" ||
    position === "relative" ||
    position === "fixed" ||
    position === "sticky" ||
    position === "static"
  ) {
    style.position = position;
  }

  // Docking/positioning
  const pos: CSSProperties = {};
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

  // Apply responsive behavior overrides (builder-only)
  if ((responsiveBehavior === "scale-proportional" || responsiveBehavior === undefined) && position !== "absolute") {
    if (responsiveBehavior === "scale-proportional") {
      // Attempt to compute aspect-ratio if both dimensions are numeric px or numbers (positive only)
      const toNum = (v?: string | number): number | undefined => {
        if (v === undefined) return undefined;
        if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
        const s = String(v).trim();
        const raw = s.endsWith("px") ? s.slice(0, -2).trim() : s;
        if (!raw) return undefined;
        // Simple numeric-only parser: digits and at most one dot
        let sawDot = false;
        for (let i = 0; i < raw.length; i++) {
          const ch = raw[i];
          if (ch === ".") { if (sawDot) return undefined; sawDot = true; continue; }
          if (ch < "0" || ch > "9") return undefined;
        }
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
      };
      const w = toNum(widthVal);
      const h = toNum(heightVal);
      if (w && h) {
        style.aspectRatio = `${w} / ${h}`;
        // Stretch to container width while keeping ratio
        style.width = "100%";
        // Let height auto-derive from aspect-ratio
        delete (style as CSSProperties).height;
      }
    }
  }

  return { ...style, ...pos };
}
