// Single-purpose: color token utilities and palette resolution

import type { Colors } from "./types";

function readToken(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return raw || null;
  } catch {
    return null;
  }
}

function hslFromToken(name: string, alpha?: number): string | null {
  const raw = readToken(name);
  if (!raw) return null;
  const a = typeof alpha === "number" ? ` / ${alpha}` : "";
  return `hsl(${raw}${a})`;
}

export function getColors(): Colors {
  // Prefer builder CSS tokens for perfect alignment
  const bg = hslFromToken("--color-bg");
  const fg = hslFromToken("--color-fg");
  if (bg && fg) {
    return {
      bg,
      stroke: hslFromToken("--color-fg", 0.45) ?? fg,
      fill: hslFromToken("--color-fg", 0.18) ?? fg,
      overlay: hslFromToken("--color-bg", 0.65) ?? bg,
    } as Colors;
  }
  // Fallback palette
  return {
    // Use DS tokens as fallbacks to avoid raw hex colors
    bg: "hsl(var(--color-bg))",
    stroke: "hsl(var(--color-fg) / 0.45)",
    fill: "hsl(var(--color-fg) / 0.18)",
    overlay: "hsl(var(--color-bg) / 0.8)",
  };
}
