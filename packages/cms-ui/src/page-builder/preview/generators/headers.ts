// Single-purpose: header and header variants

import { getColors } from "../../preview/color";
import { grid, rect } from "../../preview/shapes";
import { svg } from "../../preview/svg";
import { CANVAS } from "../../preview/types";

function headerBase(): string {
  const c = getColors();
  const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
  const nav = grid(180, 20, 4, 1, 36, 20, c, 12);
  const logo = rect(20, 20, 80, 20, c, { r: 6 });
  return svg([bar, logo, nav], CANVAS, c);
}

export function headerSection(): string {
  return headerBase();
}

export function headerSectionMinimal(): string {
  return headerBase();
}

export function headerSectionCenterLogo(): string {
  const c = getColors();
  const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
  const logo = rect((CANVAS.w - 80) / 2, 20, 80, 20, c, { r: 6 });
  const utilL = grid(24, 20, 2, 1, 36, 20, c, 12);
  const utilR = grid(CANVAS.w - 24 - (2 * 36 + 12), 20, 2, 1, 36, 20, c, 12);
  return svg([bar, logo, utilL, utilR], CANVAS, c);
}

export function headerSectionSplitUtilities(): string {
  const c = getColors();
  const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
  const nav = grid(100, 20, 3, 1, 50, 20, c, 10);
  const left = rect(20, 20, 60, 20, c, { r: 6 });
  const right = grid(CANVAS.w - 24 - (3 * 28 + 12 * 2), 20, 3, 1, 28, 20, c, 12);
  return svg([bar, left, nav, right], CANVAS, c);
}

export function headerSectionTransparent(): string {
  const c = getColors();
  const hero = rect(12, 12, CANVAS.w - 24, CANVAS.h - 24, c, { r: 10 });
  const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6, fill: c.overlay, stroke: c.stroke });
  const logo = rect(20, 20, 80, 20, c, { r: 6 });
  const nav = grid(180, 20, 4, 1, 36, 20, c, 12);
  return svg([hero, bar, logo, nav], CANVAS, c);
}

export function headerSectionSticky(): string {
  const c = getColors();
  const content = grid(20, 60, 3, 2, 110, 60, c, 12);
  const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
  const logo = rect(20, 20, 80, 20, c, { r: 6 });
  const nav = grid(180, 20, 4, 1, 36, 20, c, 12);
  return svg([content, bar, logo, nav], CANVAS, c);
}

