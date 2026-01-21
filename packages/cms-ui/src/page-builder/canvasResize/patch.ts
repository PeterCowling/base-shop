import type { Handle } from "./types";

export function computePatch(args: {
  widthKey: string;
  heightKey: string;
  leftKey: string;
  topKey: string;
  handle: Handle;
  left: number;
  top: number;
  width: number;
  height: number;
  parent: HTMLElement | null | undefined;
  dockX?: "left" | "right" | "center";
  dockY?: "top" | "bottom" | "center";
  snapW: boolean;
  snapH: boolean;
}) {
  const {
    widthKey,
    heightKey,
    leftKey,
    topKey,
    handle,
    left,
    top,
    width,
    height,
    parent,
    dockX,
    dockY,
    snapW,
    snapH,
  } = args;

  const patch: Record<string, string> = {
    [widthKey]: snapW ? "100%" : `${width}px`,
    [heightKey]: snapH ? "100%" : `${height}px`,
  };

  if (handle.includes("w")) {
    if (dockX !== "right") patch[leftKey] = `${Math.round(left)}px`;
  } else if (handle.includes("e") && dockX === "right" && parent) {
    const right = Math.round(parent.offsetWidth - (left + width));
    patch.right = `${right}px`;
  }

  if (handle.includes("n")) {
    if (dockY !== "bottom") patch[topKey] = `${Math.round(top)}px`;
  } else if (handle.includes("s") && dockY === "bottom" && parent) {
    const bottom = Math.round(parent.offsetHeight - (top + height));
    patch.bottom = `${bottom}px`;
  }

  return patch;
}

