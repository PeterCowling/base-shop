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

  // Helper to parse a block string and write into the map
  function parseBlock(block: string, suffix: string | null) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) {
      const [, name, h, s, l] = m;
      const key = suffix ? `${name}${suffix}` : name;
      map[key] = { h: Number(h), s: Number(s) / 100, l: Number(l) / 100 };
    }
  }

  // Extract :root block
  const rootMatch = src.match(/:root\s*\{([\s\S]*?)\}/i);
  if (rootMatch) parseBlock(rootMatch[1], null);
  // Extract html.theme-dark block and store with "-dark" suffix for lookup
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

describe("CMS tokens – contrast safety", () => {
  // Resolve relative to this test file to avoid cwd differences
  const tokensPath = join(__dirname, "..", "src", "app", "cms.tokens.css");
  const tokens = parseTokens(tokensPath);
  const ccc = new ColorContrastChecker();

  const pairs: [string, string][] = [
    ["color-fg", "color-bg"],
    ["color-primary-fg", "color-primary"],
    ["color-accent-fg", "color-accent"],
    ["color-danger-fg", "color-danger"],
    ["color-success-fg", "color-success"],
    ["color-warning-fg", "color-warning"],
    ["color-info-fg", "color-info"],
    // Dark-mode counterparts
    ["color-fg-dark", "color-bg-dark"],
    ["color-primary-fg-dark", "color-primary-dark"],
    ["color-accent-fg-dark", "color-accent-dark"],
    ["color-danger-fg-dark", "color-danger-dark"],
    ["color-success-fg-dark", "color-success-dark"],
    ["color-warning-fg-dark", "color-warning-dark"],
    ["color-info-fg-dark", "color-info-dark"],
  ];

  it.each(pairs)("%s on %s >= AA (4.5:1)", (fgVar, bgVar) => {
    const fg = tokens[fgVar];
    const bg = tokens[bgVar];
    expect(fg).toBeDefined();
    expect(bg).toBeDefined();
    const fgHex = hslToHex(hg(fg));
    const bgHex = hslToHex(hg(bg));
    const ratio = ccc.getContrastRatio(
      ccc.hexToLuminance(fgHex),
      ccc.hexToLuminance(bgHex)
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * Overlay scenarios – ensure readable foreground on layered backgrounds.
   * Examples in code: bg-background/60, hover:bg-muted/10, etc.
   */
  function composite(
    top: { h: number; s: number; l: number },
    alpha: number,
    bottom: { h: number; s: number; l: number }
  ): { r: number; g: number; b: number } {
    const T = hslToRgb(top);
    const B = hslToRgb(bottom);
    const r = Math.round(T.r * alpha + B.r * (1 - alpha));
    const g = Math.round(T.g * alpha + B.g * (1 - alpha));
    const b = Math.round(T.b * alpha + B.b * (1 - alpha));
    return { r, g, b };
  }

  function compositeText(
    text: { h: number; s: number; l: number },
    alpha: number,
    bg: { h: number; s: number; l: number }
  ): string {
    const rgb = composite(text, alpha, bg);
    return rgbToHex(rgb);
  }

  const overlayAlphas = [0.6, 0.3, 0.2, 0.1];
  const overlayVars = [
    { name: "color-bg", dark: "color-bg-dark" },
    { name: "color-muted", dark: "color-muted-dark" },
    { name: "surface-2", dark: "surface-2" },
    { name: "surface-3", dark: "surface-3" },
  ] as const;

  function getOverlayToken(name: string, mode: "light" | "dark"): Hsl | undefined {
    if (mode === "dark") {
      // Prefer explicit dark-suffixed value parsed from html.theme-dark block
      return tokens[`${name}-dark`] ?? tokens[name];
    }
    return tokens[name];
  }

  it.each(overlayAlphas)(
    "foreground on composite(bg + overlay@%s) >= AA (4.5:1)",
    (alpha) => {
      const lightBg = tokens["color-bg"];
      const darkBg = tokens["color-bg-dark"];
      const lightFg = tokens["color-fg"];
      const darkFg = tokens["color-fg-dark"];
      expect(lightBg && darkBg && lightFg && darkFg).toBeTruthy();

      for (const ov of overlayVars) {
        const overlayLight = getOverlayToken(ov.name, "light");
        const overlayDark = getOverlayToken(ov.name, "dark");
        expect(overlayLight && overlayDark).toBeTruthy();

        // Light mode composite
        const compLight = composite(overlayLight!, alpha, lightBg!);
        const ratioLight = ccc.getContrastRatio(
          ccc.hexToLuminance(hslToHex(hg(lightFg!))),
          ccc.hexToLuminance(rgbToHex(compLight))
        );
        expect(ratioLight).toBeGreaterThanOrEqual(4.5);

        // Dark mode composite
        const compDark = composite(overlayDark!, alpha, darkBg!);
        const ratioDark = ccc.getContrastRatio(
          ccc.hexToLuminance(hslToHex(hg(darkFg!))),
          ccc.hexToLuminance(rgbToHex(compDark))
        );
        expect(ratioDark).toBeGreaterThanOrEqual(4.5);
      }
    }
  );

  it("foreground on stacked overlays (muted@0.1 over bg@0.6) meets AA", () => {
    const lightBg = tokens["color-bg"]!;
    const darkBg = tokens["color-bg-dark"]!;
    const lightFg = tokens["color-fg"]!;
    const darkFg = tokens["color-fg-dark"]!;
    const mutedL = tokens["color-muted"]!;
    const mutedD = tokens["color-muted-dark"]!;

    // Light stack
    const step1 = composite(mutedL, 0.1, lightBg);
    const step2 = composite(hgToHsl(step1), 0.6, lightBg);
    const ratioL = ccc.getContrastRatio(
      ccc.hexToLuminance(hslToHex(hg(lightFg))),
      ccc.hexToLuminance(rgbToHex(step2))
    );
    expect(ratioL).toBeGreaterThanOrEqual(4.5);

    // Dark stack
    const step1d = composite(mutedD, 0.1, darkBg);
    const step2d = composite(hgToHsl(step1d), 0.6, darkBg);
    const ratioD = ccc.getContrastRatio(
      ccc.hexToLuminance(hslToHex(hg(darkFg))),
      ccc.hexToLuminance(rgbToHex(step2d))
    );
    expect(ratioD).toBeGreaterThanOrEqual(4.5);
  });

  it.each(overlayAlphas)(
    "muted-foreground (65% alpha) on composite(bg + overlay@%s) >= 3.0:1",
    (alpha) => {
      const lightBg = tokens["color-bg"];
      const darkBg = tokens["color-bg-dark"];
      const lightFg = tokens["color-fg"];
      const darkFg = tokens["color-fg-dark"];
      expect(lightBg && darkBg && lightFg && darkFg).toBeTruthy();

      for (const ov of overlayVars) {
        const overlayLight = getOverlayToken(ov.name, "light");
        const overlayDark = getOverlayToken(ov.name, "dark");
        expect(overlayLight && overlayDark).toBeTruthy();

        // Light mode composite background
        const compLightBg = composite(overlayLight!, alpha, lightBg!);
        // Text with 65% alpha composited over background
        const mutedTextLight = compositeText(lightFg!, 0.65, hgToHsl(compLightBg));
        const ratioLight = ccc.getContrastRatio(
          ccc.hexToLuminance(mutedTextLight),
          ccc.hexToLuminance(rgbToHex(compLightBg))
        );
        expect(ratioLight).toBeGreaterThanOrEqual(3.0);

        // Dark mode composite background
        const compDarkBg = composite(overlayDark!, alpha, darkBg!);
        const mutedTextDark = compositeText(darkFg!, 0.65, hgToHsl(compDarkBg));
        const ratioDark = ccc.getContrastRatio(
          ccc.hexToLuminance(mutedTextDark),
          ccc.hexToLuminance(rgbToHex(compDarkBg))
        );
        expect(ratioDark).toBeGreaterThanOrEqual(3.0);
      }
    }
  );
});

// tiny helper so TS doesn’t inline spreads repeatedly
function hg(v: Hsl): Hsl {
  return { h: v.h, s: v.s, l: v.l };
}

function hgToHsl(rgb: { r: number; g: number; b: number }): Hsl {
  // naive conversion via RGB -> HSL for compositing text alpha; we only need luma trends
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
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
  return { h, s, l };
}
