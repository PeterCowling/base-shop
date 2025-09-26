// Single-purpose: container previews (section, grid, tabs, etc.)

import { CANVAS } from "../../preview/types";
import { getColors } from "../../preview/color";
import { svg } from "../../preview/svg";
import { grid, rect, textLines, line } from "../../preview/shapes";

export function genericSection(): string {
  const c = getColors();
  const headerBox = rect(20, 24, CANVAS.w - 40, 48, c);
  const body = rect(20, 84, CANVAS.w - 40, 112, c);
  const lines = textLines(36, 44, 240, 3, c, 12);
  return svg([headerBox, body, lines], CANVAS, c);
}

export function multiColumn(): string {
  const c = getColors();
  const cols = grid(20, 28, 3, 1, 110, 160, c, 20);
  return svg([cols], CANVAS, c);
}

export function stackFlex(): string {
  const c = getColors();
  const a = rect(20, 24, CANVAS.w - 40, 50, c);
  const b = rect(20, 84, CANVAS.w - 40, 50, c);
  const d = rect(20, 144, CANVAS.w - 40, 50, c);
  return svg([a, b, d], CANVAS, c);
}

export function gridContainer(): string {
  const c = getColors();
  const g = grid(20, 28, 4, 2, 80, 68, c, 12);
  return svg([g], CANVAS, c);
}

export function carouselContainer(): string {
  const c = getColors();
  const track = rect(20, 60, CANVAS.w - 40, 100, c);
  const cards = grid(28, 70, 4, 1, 78, 80, c, 12);
  return svg([track, cards], CANVAS, c);
}

export function tabsAccordionContainer(): string {
  const c = getColors();
  const tabs = grid(24, 24, 4, 1, 80, 26, c, 12);
  const panel = rect(20, 64, CANVAS.w - 40, 130, c);
  return svg([tabs, panel], CANVAS, c);
}

export function dataset(): string {
  const c = getColors();
  const table = grid(28, 36, 4, 3, 80, 40, c, 12);
  return svg([table], CANVAS, c);
}

export function repeater(): string {
  const c = getColors();
  const items = grid(24, 28, 1, 3, CANVAS.w - 48, 52, c, 12);
  return svg([items], CANVAS, c);
}

export function bind(): string {
  const c = getColors();
  const box = rect(24, 36, CANVAS.w - 48, 140, c);
  const plug = textLines(40, 60, 220, 3, c, 12);
  const arrow = line(280, 110, 360, 110, c);
  const target = rect(340, 92, 40, 36, c, { r: 6 });
  return svg([box, plug, arrow, target], CANVAS, c);
}

