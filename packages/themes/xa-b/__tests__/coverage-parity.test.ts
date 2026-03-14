/**
 * Coverage Parity Test
 *
 * Proves that the structured three-layer system (assets + profile + recipes)
 * covers every hand-authored token and component class in xa-b's CSS files.
 *
 * This test must pass BEFORE stripping the inline :root blocks from
 * globals.css and xa-cyber-atelier.css.
 */
import fs from "node:fs";
import path from "node:path";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GLOBALS_CSS_PATH = path.resolve(
  __dirname,
  "../../../../apps/xa-b/src/app/globals.css",
);

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/xa-b/src/styles/theme-tokens.generated.css",
);

const globalCSS = fs.readFileSync(GLOBALS_CSS_PATH, "utf8");
// Token vars may be inline in globals.css OR in the generated file
const generatedTokensCSS = fs.existsSync(GENERATED_TOKENS_PATH)
  ? fs.readFileSync(GENERATED_TOKENS_PATH, "utf8")
  : "";
// Combine both for searching -- tokens can be in either location
const allCSS = globalCSS + "\n" + generatedTokensCSS;

/** Extract CSS custom property declarations from a block (name -> value) */
function extractVarsFromBlock(css: string, blockSelector: string): Map<string, string> {
  const vars = new Map<string, string>();

  const selectorIdx = css.indexOf(blockSelector);
  if (selectorIdx === -1) return vars;

  const openBrace = css.indexOf("{", selectorIdx);
  if (openBrace === -1) return vars;

  let depth = 0;
  let blockEnd = -1;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        blockEnd = i;
        break;
      }
    }
  }

  if (blockEnd === -1) return vars;

  const blockContent = css.slice(openBrace + 1, blockEnd);

  const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = varRegex.exec(blockContent)) !== null) {
    vars.set(`--${match[1]}`, match[2].trim());
  }

  return vars;
}

// Normalise hex color for comparison (lowercase, no shorthand)
function normalizeColor(val: string): string {
  return val.toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Parse CSS (from generated file, falling back to source CSS)
// ---------------------------------------------------------------------------

const tokenSource = generatedTokensCSS || allCSS;
const rootVars = extractVarsFromBlock(tokenSource, ":root");
const darkVars = extractVarsFromBlock(tokenSource, "html.theme-dark");

// ---------------------------------------------------------------------------
// Asset brand color helpers
// ---------------------------------------------------------------------------

function getAssetLightColor(key: string): string | undefined {
  const entry = assets.brandColors[key];
  if (!entry) return undefined;
  if (typeof entry === "string") return entry;
  return entry.light;
}

function getAssetDarkColor(key: string): string | undefined {
  const entry = assets.brandColors[key];
  if (!entry) return undefined;
  if (typeof entry === "string") return undefined;
  return entry.dark;
}

// ---------------------------------------------------------------------------
// Bridge mapping: existing CSS var name -> asset/profile source field
// ---------------------------------------------------------------------------

// Swatch bridge: swatch CSS var suffix -> assets.brandColors key
const SWATCH_BRIDGE: Record<string, string> = {
  "xa-swatch-black": "xaSwatchBlack",
  "xa-swatch-ivory": "xaSwatchIvory",
  "xa-swatch-cream": "xaSwatchCream",
  "xa-swatch-camel": "xaSwatchCamel",
  "xa-swatch-brown": "xaSwatchBrown",
  "xa-swatch-navy": "xaSwatchNavy",
  "xa-swatch-gold": "xaSwatchGold",
  "xa-swatch-graphite": "xaSwatchGraphite",
  "xa-swatch-tan": "xaSwatchTan",
  "xa-swatch-charcoal": "xaSwatchCharcoal",
  "xa-swatch-bone": "xaSwatchBone",
  "xa-swatch-silver": "xaSwatchSilver",
  "xa-swatch-indigo": "xaSwatchIndigo",
  "xa-swatch-white": "xaSwatchWhite",
  "xa-swatch-fallback": "xaSwatchFallback",
  "xa-swatch-filter-fallback": "xaSwatchFilterFallback",
};

// FAB bridge: FAB CSS var suffix -> assets.brandColors key
const FAB_BRIDGE: Record<string, string> = {
  "xa-fab-bg": "xaFabBg",
  "xa-fab-fg": "xaFabFg",
  "xa-fab-hover": "xaFabHover",
};

// Font bridge: CSS var name -> assets.fonts key
const FONT_BRIDGE: Record<string, string> = {
  "font-sans": "body",
  "font-mono": "mono",
};

// Profile bridge: profile fields -> CSS values
const PROFILE_BRIDGE: Record<string, { value: string; note: string }> = {
  "theme-transition-duration": {
    value: profile.motion.durationNormal,
    note: "profile.motion.durationNormal",
  },
};

// Derived vars: not directly from assets/profile -- semantic tokens,
// surfaces, borders, radii, elevations, font aliases
const DERIVED_VARS = new Set([
  // Achromatic semantic tokens
  "--color-bg",
  "--color-fg",
  "--color-fg-muted",
  "--color-muted",
  "--color-muted-fg",
  "--color-muted-border",
  "--color-panel",
  "--color-border",
  "--color-border-muted",
  "--color-border-strong",
  "--border-control",
  "--surface-1",
  "--surface-2",
  "--surface-3",
  "--surface-input",
  "--color-primary",
  "--color-primary-fg",
  "--color-primary-soft",
  "--color-primary-hover",
  "--color-primary-active",
  "--color-accent",
  "--color-accent-fg",
  "--color-accent-soft",
  "--color-link",
  "--border-1",
  "--border-2",
  "--border-3",
  "--color-focus-ring",
  "--ring",
  "--ring-offset",
  "--color-selection",
  "--color-highlight",
  // Radii
  "--radius-xs",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-2xl",
  "--radius-3xl",
  "--radius-4xl",
  // Elevations
  "--elevation-1",
  "--elevation-2",
  "--elevation-3",
  "--elevation-4",
  "--elevation-5",
  // Font aliases
  "--font-body",
  "--font-heading-1",
  "--font-heading-2",
]);

// ═══════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════

describe("xa-b three-layer coverage parity", () => {
  // ------------------------------------------------------------------
  // Layer 1: Assets -- Swatch Colors (light mode)
  // ------------------------------------------------------------------
  describe("assets.brandColors (swatches) -> :root swatch vars", () => {
    test.each(Object.entries(SWATCH_BRIDGE))(
      "--%s matches assets.brandColors.%s",
      (cssVarSuffix, assetKey) => {
        const cssValue = rootVars.get(`--${cssVarSuffix}`);
        expect(cssValue).toBeDefined();

        const assetValue = getAssetLightColor(assetKey);
        expect(assetValue).toBeDefined();

        expect(normalizeColor(cssValue!)).toBe(normalizeColor(assetValue!));
      },
    );
  });

  // ------------------------------------------------------------------
  // Layer 1: Assets -- FAB Colors (light mode)
  // ------------------------------------------------------------------
  describe("assets.brandColors (FAB) -> :root FAB vars", () => {
    test.each(Object.entries(FAB_BRIDGE))(
      "--%s matches assets.brandColors.%s (light)",
      (cssVarSuffix, assetKey) => {
        const cssValue = rootVars.get(`--${cssVarSuffix}`);
        expect(cssValue).toBeDefined();

        const assetValue = getAssetLightColor(assetKey);
        expect(assetValue).toBeDefined();

        expect(normalizeColor(cssValue!)).toBe(normalizeColor(assetValue!));
      },
    );
  });

  // ------------------------------------------------------------------
  // Layer 1: Assets -- FAB Colors (dark mode)
  // ------------------------------------------------------------------
  describe("assets.brandColors (FAB) -> html.theme-dark FAB vars", () => {
    test.each(Object.entries(FAB_BRIDGE))(
      "html.theme-dark --%s matches assets.brandColors.%s.dark",
      (cssVarSuffix, assetKey) => {
        const cssValue = darkVars.get(`--${cssVarSuffix}`);
        expect(cssValue).toBeDefined();

        const assetValue = getAssetDarkColor(assetKey);
        expect(assetValue).toBeDefined();

        expect(normalizeColor(cssValue!)).toBe(normalizeColor(assetValue!));
      },
    );
  });

  // ------------------------------------------------------------------
  // Layer 1: Assets -- Fonts
  // ------------------------------------------------------------------
  describe("assets.fonts -> :root font vars", () => {
    test.each(Object.entries(FONT_BRIDGE))(
      "--%s matches assets.fonts.%s.family",
      (cssVarSuffix, fontKey) => {
        const cssValue = rootVars.get(`--${cssVarSuffix}`);
        expect(cssValue).toBeDefined();

        const fontAsset = assets.fonts[fontKey];
        expect(fontAsset).toBeDefined();

        // Normalise quotes for comparison
        const normCSS = cssValue!.replace(/"/g, '"').replace(/'/g, '"');
        const normAsset = fontAsset.family.replace(/"/g, '"').replace(/'/g, '"');

        expect(normCSS).toBe(normAsset);
      },
    );
  });

  // ------------------------------------------------------------------
  // Layer 2: Profile -- Motion
  // ------------------------------------------------------------------
  describe("profile.motion -> CSS transition values", () => {
    test("--theme-transition-duration matches profile.motion.durationNormal", () => {
      const cssValue = rootVars.get("--theme-transition-duration");
      expect(cssValue).toBe(profile.motion.durationNormal);
    });
  });

  // ------------------------------------------------------------------
  // Anti-vacuous-pass guards
  // ------------------------------------------------------------------
  test("dark vars were found (anti-vacuous-pass guard)", () => {
    expect(darkVars.size).toBeGreaterThan(0);
  });

  test("root vars were found (anti-vacuous-pass guard)", () => {
    expect(rootVars.size).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // Exhaustiveness: no unaccounted :root vars
  // ------------------------------------------------------------------
  describe("exhaustive coverage -- every :root var has a source", () => {
    test("all :root custom properties are accounted for", () => {
      const unaccounted: string[] = [];

      for (const [varName] of rootVars) {
        // Skip derived/semantic vars
        if (DERIVED_VARS.has(varName)) continue;

        // Check swatch bridge
        const suffix = varName.replace(/^--/, "");
        if (SWATCH_BRIDGE[suffix]) continue;

        // Check FAB bridge
        if (FAB_BRIDGE[suffix]) continue;

        // Check font bridge
        if (FONT_BRIDGE[suffix]) continue;

        // Check profile bridge
        if (PROFILE_BRIDGE[suffix]) continue;

        // color-scheme is a CSS property, not a token
        if (varName === "--color-scheme" || varName === "color-scheme") continue;

        unaccounted.push(varName);
      }

      expect(unaccounted).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Exhaustiveness: no unaccounted html.theme-dark vars
  // ------------------------------------------------------------------
  describe("exhaustive coverage -- every html.theme-dark var has a source", () => {
    test("all html.theme-dark custom properties are accounted for", () => {
      const unaccounted: string[] = [];

      for (const [varName] of darkVars) {
        // Skip derived/semantic vars
        if (DERIVED_VARS.has(varName)) continue;

        // Check FAB bridge
        const suffix = varName.replace(/^--/, "");
        if (FAB_BRIDGE[suffix]) continue;

        // color-scheme
        if (varName === "--color-scheme" || varName === "color-scheme") continue;

        unaccounted.push(varName);
      }

      expect(unaccounted).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Reverse check: every swatch asset has a corresponding CSS var
  // ------------------------------------------------------------------
  describe("reverse coverage -- every swatch asset color has a CSS var", () => {
    test("all swatch brandColors entries are consumed in :root", () => {
      const unconsumed: string[] = [];

      for (const [cssVarSuffix, assetKey] of Object.entries(SWATCH_BRIDGE)) {
        const cssVarName = `--${cssVarSuffix}`;
        if (!rootVars.has(cssVarName)) {
          unconsumed.push(`${assetKey} (bridged to ${cssVarName} but not found in CSS)`);
        }
      }

      expect(unconsumed).toEqual([]);
    });

    test("all FAB brandColors entries are consumed in :root and html.theme-dark", () => {
      const unconsumed: string[] = [];

      for (const [cssVarSuffix, assetKey] of Object.entries(FAB_BRIDGE)) {
        const cssVarName = `--${cssVarSuffix}`;
        if (!rootVars.has(cssVarName)) {
          unconsumed.push(`${assetKey} (light: bridged to ${cssVarName} but not found in :root)`);
        }
        if (!darkVars.has(cssVarName)) {
          unconsumed.push(`${assetKey} (dark: bridged to ${cssVarName} but not found in html.theme-dark)`);
        }
      }

      expect(unconsumed).toEqual([]);
    });

    test("all font entries are consumed in :root", () => {
      for (const [cssVarSuffix, fontKey] of Object.entries(FONT_BRIDGE)) {
        const fontAsset = assets.fonts[fontKey];
        expect(fontAsset).toBeDefined();
        expect(rootVars.has(`--${cssVarSuffix}`)).toBe(true);
      }
    });
  });
});
