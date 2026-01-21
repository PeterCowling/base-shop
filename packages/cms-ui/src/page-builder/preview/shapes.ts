// Single-purpose: primitive shapes and layout helpers for previews

import type { Colors } from "./types";

export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  c: Colors,
  opts: { r?: number; fill?: string; stroke?: string } = {}
): string {
  const r = opts.r ?? 8;
  const fill = opts.fill ?? c.fill;
  const stroke = opts.stroke ?? c.stroke;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
}

export function line(x1: number, y1: number, x2: number, y2: number, c: Colors): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.stroke}" stroke-width="2" stroke-linecap="round"/>`;
}

export function textLines(x: number, y: number, w: number, rows: number, c: Colors, gap = 10): string {
  const parts: string[] = [];
  for (let i = 0; i < rows; i++) {
    const lw = i === 0 ? w : Math.max(40, w - i * 24);
    parts.push(rect(x, y + i * (8 + gap), lw, 8, c, { r: 4 }));
  }
  return parts.join("");
}

export function grid(
  x: number,
  y: number,
  cols: number,
  rows: number,
  cw: number,
  ch: number,
  c: Colors,
  gap = 10
): string {
  const parts: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c2 = 0; c2 < cols; c2++) {
      parts.push(rect(x + c2 * (cw + gap), y + r * (ch + gap), cw, ch, c));
    }
  }
  return parts.join("");
}

