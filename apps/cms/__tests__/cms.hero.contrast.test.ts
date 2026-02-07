/* eslint-env jest */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import ColorContrastChecker from "color-contrast-checker";

type Hsl = { h: number; s: number; l: number };

function parseTokens(filePath: string): Record<string, Hsl> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads tokens from a repo-relative path constructed from literals
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

function parseHeroOverlayAlpha(filePath: string): { light?: number; dark?: number } {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads tokens from a repo-relative path constructed from literals
  const src = readFileSync(filePath, "utf8");
  const light = src.match(/--hero-contrast-overlay:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%\s*\/\s*([\d.]+)/);
  const darkBlock = src.match(/html\.theme-dark\s*\{([\s\S]*?)\}/i)?.[1] ?? "";
  const dark = darkBlock.match(/--hero-contrast-overlay:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%\s*\/\s*([\d.]+)/);
  return {
    light: light ? Number(light[1]) : undefined,
    dark: dark ? Number(dark[1]) : undefined,
  };
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

function composite(top: { r: number; g: number; b: number }, alpha: number, bottom: { r: number; g: number; b: number }) {
  const r = Math.round(top.r * alpha + bottom.r * (1 - alpha));
  const g = Math.round(top.g * alpha + bottom.g * (1 - alpha));
  const b = Math.round(top.b * alpha + bottom.b * (1 - alpha));
  return { r, g, b };
}

describe("CMS hero gradient – contrast safety", () => {
  const tokensPath = join(__dirname, "..", "src", "app", "cms.tokens.css");
  const tokens = parseTokens(tokensPath);
  const { light: overlayA, dark: overlayAdark } = parseHeroOverlayAlpha(tokensPath);
  const ccc = new ColorContrastChecker();

  it("hero foreground vs each gradient stop with overlay >= AA (4.5:1)", () => {
    const heroFg = tokens["hero-fg"]; // text color, expected white
    expect(heroFg).toBeDefined();
    expect(overlayA).toBeDefined();
    const bgStops = [tokens["gradient-hero-from"], tokens["gradient-hero-via"], tokens["gradient-hero-to"]];
    bgStops.forEach((stop) => expect(stop).toBeDefined());

    const fgHex = hslToHex(heroFg!);
    const overlayRgb = hslToRgb({ h: 0, s: 0, l: 0 }); // black overlay
    const alpha = overlayA!; // value already 0..1 in tokens

    for (const stop of bgStops as Hsl[]) {
      const stopRgb = hslToRgb(stop);
      const comp = composite(overlayRgb, alpha, stopRgb);
      const ratio = ccc.getContrastRatio(ccc.hexToLuminance(fgHex), ccc.hexToLuminance(rgbToHex(comp)));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("hero foreground at 90% alpha remains >= AA", () => {
    const heroFg = tokens["hero-fg"];
    expect(heroFg).toBeDefined();
    expect(overlayA).toBeDefined();
    const bgStops = [tokens["gradient-hero-from"], tokens["gradient-hero-via"], tokens["gradient-hero-to"]];
    bgStops.forEach((stop) => expect(stop).toBeDefined());

    const alphaText = 0.9;
    const overlayRgb = hslToRgb({ h: 0, s: 0, l: 0 });
    const textRgb = hslToRgb(heroFg!); // white
    const alpha = overlayA!;

    for (const stop of bgStops as Hsl[]) {
      const stopRgb = hslToRgb(stop);
      const compBg = composite(overlayRgb, alpha, stopRgb);
      // Effective text colour when rendered at alphaText over compBg
      const effText = composite(textRgb, alphaText, compBg);
      const ratio = ccc.getContrastRatio(
        ccc.hexToLuminance(rgbToHex(effText)),
        ccc.hexToLuminance(rgbToHex(compBg))
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("dark: hero foreground vs each gradient stop with overlay >= AA (4.5:1)", () => {
    const heroFg = tokens["hero-fg-dark"] ?? tokens["hero-fg"]; // often same as light
    expect(heroFg).toBeDefined();
    const alpha = overlayAdark ?? overlayA ?? 0.55; // fall back to light if not set
    const bgStops = [
      tokens["gradient-hero-from-dark"] ?? tokens["gradient-hero-from"],
      tokens["gradient-hero-via-dark"] ?? tokens["gradient-hero-via"],
      tokens["gradient-hero-to-dark"] ?? tokens["gradient-hero-to"],
    ];
    bgStops.forEach((stop) => expect(stop).toBeDefined());

    const fgHex = hslToHex(heroFg!);
    const overlayRgb = hslToRgb({ h: 0, s: 0, l: 0 });

    for (const stop of bgStops as Hsl[]) {
      const stopRgb = hslToRgb(stop);
      const comp = composite(overlayRgb, alpha, stopRgb);
      const ratio = ccc.getContrastRatio(ccc.hexToLuminance(fgHex), ccc.hexToLuminance(rgbToHex(comp)));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
