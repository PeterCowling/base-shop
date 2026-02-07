// Single-purpose: svg wrapper and data-url encoding

import { getColors } from "./color";
import type { Colors,Size } from "./types";
import { CANVAS } from "./types";

export function svg(parts: string[], size: Size = CANVAS, c: Colors = getColors()): string {
  const body = parts.join("");
  const s = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}" role="img" aria-label="preview">` +
    `<rect x="0" y="0" width="100%" height="100%" fill="${c.bg}"/>` +
    body +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
}

