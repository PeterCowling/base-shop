/* eslint-env jest */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import ColorContrastChecker from "color-contrast-checker";

type Hsl = { h: number; s: number; l: number };

function parseTokens(filePath: string): Record<string, Hsl> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test helper reads theme token files by computed path
  const src = readFileSync(filePath, "utf8");
  const map: Record<string, Hsl> = {};

  const re = /--([a-z0-9-]+):\s*([^;]+);/gi;

  function parseHsl(rawValue: string): Hsl | null {
    const match = rawValue.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
    if (!match) return null;
    const [, h, s, l] = match;
    return { h: Number(h), s: Number(s) / 100, l: Number(l) / 100 };
  }

  function parseBlock(block: string, suffix: string | null) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) {
      const [, name, value] = m;
      const parsed = parseHsl(value);
      if (!parsed) continue;
      const key = suffix ? `${name}${suffix}` : name;
      map[key] = parsed;
    }
  }

  const rootMatch = src.match(/:root\s*\{([\s\S]*?)\}/i);
  if (rootMatch) parseBlock(rootMatch[1], null);
  const darkMatch = src.match(/html\.theme-dark\s*\{([\s\S]*?)\}/i);
  if (darkMatch) parseBlock(darkMatch[1], "-dark");

  return map;
}

function hslToRgb({ h, s, l }: Hsl): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hh >= 0 && hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return { r, g, b };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

describe("All themes – token contrast safety", () => {
  const ccc = new ColorContrastChecker();
  const themes = ["base", "bcd", "brandx", "dark", "prime"] as const;
  const pairs: [string, string][] = [
    ["color-fg", "color-bg"],
    ["color-primary-fg", "color-primary"],
    ["color-accent-fg", "color-accent"],
    ["color-danger-fg", "color-danger"],
    ["color-success-fg", "color-success"],
    ["color-warning-fg", "color-warning"],
    ["color-info-fg", "color-info"],
  ];

  it.each(themes)("%s: AA (4.5:1) for core pairs (light/dark when available)", (theme) => {
    const tokensPath = join(__dirname, "..", "..", "..", "packages", "themes", theme, "tokens.css");
    const tokens = parseTokens(tokensPath);
    for (const [fgVar, bgVar] of pairs) {
      const fg = tokens[fgVar];
      const bg = tokens[bgVar];
      if (fg && bg) {
        const ratio = ccc.getContrastRatio(
          ccc.hexToLuminance(hslToHex(fg)),
          ccc.hexToLuminance(hslToHex(bg))
        );
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }

      const fgD = tokens[`${fgVar}-dark`];
      const bgD = tokens[`${bgVar}-dark`];
      if (fgD && bgD) {
        const ratioD = ccc.getContrastRatio(
          ccc.hexToLuminance(hslToHex(fgD)),
          ccc.hexToLuminance(hslToHex(bgD))
        );
        expect(ratioD).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
