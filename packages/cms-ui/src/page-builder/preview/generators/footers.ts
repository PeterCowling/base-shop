// Single-purpose: footer and footer variants

import { getColors } from "../../preview/color";
import { grid, rect, textLines } from "../../preview/shapes";
import { svg } from "../../preview/svg";
import { CANVAS } from "../../preview/types";

function footerBase(): string {
  const c = getColors();
  const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
  const cols = grid(20, CANVAS.h - 120, 3, 1, 110, 52, c, 20);
  return svg([cols, bar], CANVAS, c);
}

export function footerSection(): string {
  return footerBase();
}

export function footerSectionSimple(): string {
  const c = getColors();
  const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
  return svg([bar], CANVAS, c);
}

export function footerSectionMultiColumn(): string {
  return footerBase();
}

export function footerSectionNewsletter(): string {
  const c = getColors();
  const form = rect(40, CANVAS.h - 120, CANVAS.w - 80, 60, c);
  const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
  return svg([form, bar], CANVAS, c);
}

export function footerSectionSocial(): string {
  const c = getColors();
  const icons = grid(40, CANVAS.h - 110, 5, 1, 40, 40, c, 16);
  const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
  return svg([icons, bar], CANVAS, c);
}

export function footerSectionLegalHeavy(): string {
  const c = getColors();
  const text = textLines(24, CANVAS.h - 120, CANVAS.w - 48, 4, c, 10);
  const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
  return svg([text, bar], CANVAS, c);
}

