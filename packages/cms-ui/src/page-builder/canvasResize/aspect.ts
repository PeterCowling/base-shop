import type { Handle } from "./types";

export function applyAspectRatio({
  constrain,
  handle,
  ratio,
  w,
  h,
  dx,
  dy,
  startL,
  startT,
  left,
  top,
}: {
  constrain: boolean;
  handle: Handle;
  ratio: number | null;
  w: number;
  h: number;
  dx: number;
  dy: number;
  startL: number;
  startT: number;
  left: number;
  top: number;
}) {
  let newW = w;
  let newH = h;
  let newLeft = left;
  let newTop = top;

  if (!constrain || !ratio || ratio <= 0) {
    return { newW, newH, left: newLeft, top: newTop };
  }

  if (handle.length === 2) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      newH = newW / ratio;
      if (handle.includes("n")) newTop = startT + (h - newH);
      if (handle.includes("w")) newLeft = startL + (w - newW);
    } else {
      newW = newH * ratio;
      if (handle.includes("w")) newLeft = startL + (w - newW);
      if (handle.includes("n")) newTop = startT + (h - newH);
    }
  } else if (handle === "e" || handle === "w") {
    newH = newW / ratio;
    if (handle === "w") newLeft = startL + (w - newW);
  } else if (handle === "n" || handle === "s") {
    newW = newH * ratio;
    if (handle === "n") newTop = startT + (h - newH);
  }
  return { newW, newH, left: newLeft, top: newTop };
}
