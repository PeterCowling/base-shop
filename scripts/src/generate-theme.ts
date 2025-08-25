// scripts/src/generate-theme.ts
//
// Generate a token map by overriding the base theme's primary colour.
// The script accepts a colour in hex (e.g. "#ff0000") or HSL string
// (e.g. "120 75% 60%") and prints a JSON map of tokens including
// the computed dark variant.

import { fileURLToPath } from "node:url";
import { tokens as baseTokensSrc } from "../../packages/themes/base/tokens.js";

export type Token = { light: string; dark?: string };
export type TokenMap = Record<`--${string}`, Token>;
export type FlatTokenMap = Record<string, string>;

// Flatten the base theme tokens to a simple mapping of name → value.
export const baseTokens: FlatTokenMap = Object.fromEntries(
  Object.entries(baseTokensSrc).flatMap(([name, defs]) => {
    const entries: [string, string][] = [[name, defs.light]];
    if (defs.dark) entries.push([`${name}-dark`, defs.dark]);
    return entries;
  })
);

function isHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function normaliseHsl(value: string): string {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 3) throw new Error("Invalid HSL colour");
  const [h, s, l] = parts;
  return `${Number(h)} ${parseFloat(s)}% ${parseFloat(l)}%`;
}

/** Create a full token map using the provided primary colour. */
export function generateTheme(primary: string): FlatTokenMap {
  let hsl = primary.trim();
  if (isHex(hsl)) hsl = hexToHsl(hsl);
  if (!/\d+\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%/.test(hsl)) {
    throw new Error("Primary colour must be hex or HSL");
  }
  hsl = normaliseHsl(hsl);
  const [h, s, l] = hsl.split(" ").map((p, i) =>
    i === 0 ? Number(p) : Number(p.replace("%", ""))
  );
  const darkL = Math.min(l + 10, 100);
  const tokens: FlatTokenMap = { ...baseTokens };
  tokens["--color-primary"] = `${h} ${s}% ${l}%`;
  tokens["--color-primary-dark"] = `${h} ${s}% ${darkL}%`;
  return tokens;
}

// If run directly, print the generated map as JSON.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const color = process.argv[2];
  if (!color) {
    console.error("Usage: ts-node scripts/src/generate-theme.ts <color>");
    process.exit(1);
  }
  try {
    const map = generateTheme(color);
    console.log(JSON.stringify(map, null, 2));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
