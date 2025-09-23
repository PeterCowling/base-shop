/* eslint-env jest */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import ColorContrastChecker from "color-contrast-checker";

type Hsl = { h: number; s: number; l: number };

function parseTokens(filePath: string): Record<string, Hsl> {
  const src = readFileSync(filePath, "utf8");
  const map: Record<string, Hsl> = {};
  const re = /--([a-z0-9-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/gi;

  function parseBlock(block: string, suffix: string | null) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) {
      const [, name, h, s, l] = m;
      const key = suffix ? `${name}${suffix}` : name;
      map[key] = { h: Number(h), s: Number(s) / 100, l: Number(l) / 100 };
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

function composite(
  top: { r: number; g: number; b: number },
  alpha: number,
  bottom: { r: number; g: number; b: number }
) {
  const r = Math.round(top.r * alpha + bottom.r * (1 - alpha));
  const g = Math.round(top.g * alpha + bottom.g * (1 - alpha));
  const b = Math.round(top.b * alpha + bottom.b * (1 - alpha));
  return { r, g, b };
}

describe("CMS muted text – contrast safety", () => {
  // The CMS sets .text-muted-foreground to hsl(var(--color-fg) / 0.85)
  const MUTED_TEXT_ALPHA = 0.85;
  const tokensPath = join(__dirname, "..", "src", "app", "cms.tokens.css");
  const t = parseTokens(tokensPath);
  const ccc = new ColorContrastChecker();

  it("muted text on bg (light/dark) >= AA (4.5:1)", () => {
    const fg = t["color-fg"];
    const bg = t["color-bg"];
    const fgD = t["color-fg-dark"] ?? fg;
    const bgD = t["color-bg-dark"] ?? bg;
    expect(fg && bg && fgD && bgD).toBeTruthy();

    // Light
    const effTextL = composite(hslToRgb(fg!), MUTED_TEXT_ALPHA, hslToRgb(bg!));
    const ratioL = ccc.getContrastRatio(
      ccc.hexToLuminance(rgbToHex(effTextL)),
      ccc.hexToLuminance(rgbToHex(hslToRgb(bg!)))
    );
    expect(ratioL).toBeGreaterThanOrEqual(4.5);

    // Dark
    const effTextD = composite(hslToRgb(fgD!), MUTED_TEXT_ALPHA, hslToRgb(bgD!));
    const ratioD = ccc.getContrastRatio(
      ccc.hexToLuminance(rgbToHex(effTextD)),
      ccc.hexToLuminance(rgbToHex(hslToRgb(bgD!)))
    );
    expect(ratioD).toBeGreaterThanOrEqual(4.5);
  });

  it("muted text on muted surface (light/dark) >= AA (4.5:1)", () => {
    const fg = t["color-fg"];
    const muted = t["color-muted"];
    const fgD = t["color-fg-dark"] ?? fg;
    const mutedD = t["color-muted-dark"] ?? muted;
    expect(fg && muted && fgD && mutedD).toBeTruthy();

    // Light
    const effTextL = composite(hslToRgb(fg!), MUTED_TEXT_ALPHA, hslToRgb(muted!));
    const ratioL = ccc.getContrastRatio(
      ccc.hexToLuminance(rgbToHex(effTextL)),
      ccc.hexToLuminance(rgbToHex(hslToRgb(muted!)))
    );
    expect(ratioL).toBeGreaterThanOrEqual(4.5);

    // Dark
    const effTextD = composite(hslToRgb(fgD!), MUTED_TEXT_ALPHA, hslToRgb(mutedD!));
    const ratioD = ccc.getContrastRatio(
      ccc.hexToLuminance(rgbToHex(effTextD)),
      ccc.hexToLuminance(rgbToHex(hslToRgb(mutedD!)))
    );
    expect(ratioD).toBeGreaterThanOrEqual(4.5);
  });
});

