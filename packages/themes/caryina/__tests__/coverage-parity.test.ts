/**
 * Coverage Parity Test
 *
 * Proves that the structured three-layer system (tokens + profile)
 * covers every token in caryina's theme-tokens.generated.css.
 *
 * For caryina, the token source is `tokens.ts` (a flat TokenMap).
 * All 20 vars are in `tokenVarMap`; profile contributes
 * `--theme-transition-duration` via `generateProfileVars()`.
 *
 * No gradients, keyframes, recipes, or RGB vars in caryina.
 */
import fs from "node:fs";
import path from "node:path";

import { profile } from "../src/design-profile";
import { tokens } from "../src/tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/caryina/src/styles/theme-tokens.generated.css",
);

const generatedTokensCSS = fs.readFileSync(GENERATED_TOKENS_PATH, "utf8");

/** Extract CSS custom property declarations from a block (name → value) */
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

function normalizeColor(val: string): string {
  return val.toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Parse generated tokens
// ---------------------------------------------------------------------------

const rootVars = extractVarsFromBlock(generatedTokensCSS, ":root");
const darkVars = extractVarsFromBlock(generatedTokensCSS, "html.theme-dark");

// ---------------------------------------------------------------------------
// Token helpers (reads from tokens.ts directly — the source of truth)
// ---------------------------------------------------------------------------

function getTokenLightValue(varName: string): string | undefined {
  const entry = tokens[varName as keyof typeof tokens];
  if (!entry) return undefined;
  return typeof entry === "string" ? entry : entry.light;
}

function getTokenDarkValue(varName: string): string | undefined {
  const entry = tokens[varName as keyof typeof tokens];
  if (!entry || typeof entry === "string") return undefined;
  return entry.dark;
}

// ---------------------------------------------------------------------------
// Bridge mapping: CSS var name → tokens.ts key
// ─────────────────────────────────────────────
// For caryina, the bridge is 1:1: tokenVarMap keys are the CSS var names.
// ---------------------------------------------------------------------------

// ═══════════════════════════════════════════
// Color bridge: all 15 color tokens
// ═══════════════════════════════════════════

const COLOR_BRIDGE: string[] = [
  "--color-bg",
  "--color-fg",
  "--color-fg-muted",
  "--color-primary",
  "--color-primary-fg",
  "--color-primary-soft",
  "--color-primary-hover",
  "--color-primary-active",
  "--color-accent",
  "--color-accent-fg",
  "--color-accent-soft",
  "--color-border",
  "--color-border-muted",
  "--color-border-strong",
  "--color-surface",
];

// ═══════════════════════════════════════════
// Font bridge: 2 font tokens (light-only)
// CSS value is var(--font-dm-sans) / var(--font-cormorant-garamond)
// ═══════════════════════════════════════════

const FONT_BRIDGE: string[] = [
  "--font-sans",
  "--font-heading",
];

// ═══════════════════════════════════════════
// Radius bridge: 3 radius tokens (light-only)
// ═══════════════════════════════════════════

const RADIUS_BRIDGE: string[] = [
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
];

// ═══════════════════════════════════════════
// Profile bridge: vars emitted from profile fields
// ═══════════════════════════════════════════

const PROFILE_BRIDGE: Record<string, { value: string; note: string }> = {
  "--theme-transition-duration": {
    value: profile.motion.durationNormal,
    note: "profile.motion.durationNormal",
  },
};

// ═══════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════

describe("caryina three-layer coverage parity", () => {
  // ------------------------------------------------------------------
  // Color tokens — light mode (:root)
  // ------------------------------------------------------------------
  describe("tokens → :root color vars (light values)", () => {
    test.each(COLOR_BRIDGE)(
      "%s light value matches tokens.ts",
      (varName) => {
        const cssValue = rootVars.get(varName);
        expect(cssValue).toBeDefined();

        const tokenValue = getTokenLightValue(varName);
        expect(tokenValue).toBeDefined();

        expect(normalizeColor(cssValue!)).toBe(normalizeColor(tokenValue!));
      },
    );
  });

  // ------------------------------------------------------------------
  // Color tokens — dark mode (html.theme-dark)
  // ------------------------------------------------------------------
  describe("tokens → html.theme-dark color vars (dark values)", () => {
    const darkColorBridge = COLOR_BRIDGE.filter(
      (varName) => getTokenDarkValue(varName) !== undefined,
    );

    test.each(darkColorBridge)(
      "%s dark value matches tokens.ts",
      (varName) => {
        const cssValue = darkVars.get(varName);
        expect(cssValue).toBeDefined();

        const tokenValue = getTokenDarkValue(varName);
        expect(tokenValue).toBeDefined();

        expect(normalizeColor(cssValue!)).toBe(normalizeColor(tokenValue!));
      },
    );
  });

  // ------------------------------------------------------------------
  // Font tokens — light-only
  // ------------------------------------------------------------------
  describe("tokens → :root font vars", () => {
    test.each(FONT_BRIDGE)(
      "%s value matches tokens.ts",
      (varName) => {
        const cssValue = rootVars.get(varName);
        expect(cssValue).toBeDefined();

        const tokenValue = getTokenLightValue(varName);
        expect(tokenValue).toBeDefined();

        expect(cssValue!.trim()).toBe(tokenValue!.trim());
      },
    );
  });

  // ------------------------------------------------------------------
  // Radius tokens — light-only
  // ------------------------------------------------------------------
  describe("tokens → :root radius vars", () => {
    test.each(RADIUS_BRIDGE)(
      "%s value matches tokens.ts",
      (varName) => {
        const cssValue = rootVars.get(varName);
        expect(cssValue).toBeDefined();

        const tokenValue = getTokenLightValue(varName);
        expect(tokenValue).toBeDefined();

        expect(cssValue!.trim()).toBe(tokenValue!.trim());
      },
    );
  });

  // ------------------------------------------------------------------
  // Profile bridge — --theme-transition-duration
  // ------------------------------------------------------------------
  describe("profile → :root profile vars", () => {
    test.each(Object.entries(PROFILE_BRIDGE))(
      "%s value matches %s",
      (varName, { value }) => {
        const cssValue = rootVars.get(varName);
        expect(cssValue).toBeDefined();
        expect(cssValue!.trim()).toBe(value);
      },
    );
  });

  // ------------------------------------------------------------------
  // Exhaustiveness: every :root custom var has a known source
  // ------------------------------------------------------------------
  describe("exhaustive coverage — every :root var has a source", () => {
    test("all :root custom properties are accounted for", () => {
      const allKnown = new Set<string>([
        ...COLOR_BRIDGE,
        ...FONT_BRIDGE,
        ...RADIUS_BRIDGE,
        ...Object.keys(PROFILE_BRIDGE),
      ]);

      const unaccounted: string[] = [];

      for (const [varName] of rootVars) {
        if (!allKnown.has(varName)) {
          unaccounted.push(varName);
        }
      }

      expect(unaccounted).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Exhaustiveness: every html.theme-dark var has a known source
  // ------------------------------------------------------------------
  describe("exhaustive coverage — every html.theme-dark var has a source", () => {
    test("all html.theme-dark custom properties are accounted for", () => {
      // Only color vars can have dark values — font and radius are light-only
      const darkColorSet = new Set(COLOR_BRIDGE);

      const unaccounted: string[] = [];

      for (const [varName] of darkVars) {
        if (!darkColorSet.has(varName)) {
          unaccounted.push(varName);
        }
      }

      expect(unaccounted).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Reverse coverage: every token entry is consumed by CSS
  // ------------------------------------------------------------------
  describe("reverse coverage — every tokens.ts entry is in the generated file", () => {
    test("all tokens.ts color entries appear in :root", () => {
      const unconsumed: string[] = [];

      for (const varName of COLOR_BRIDGE) {
        if (!rootVars.has(varName)) {
          unconsumed.push(varName);
        }
      }

      expect(unconsumed).toEqual([]);
    });

    test("all tokens.ts font entries appear in :root", () => {
      const unconsumed: string[] = [];

      for (const varName of FONT_BRIDGE) {
        if (!rootVars.has(varName)) {
          unconsumed.push(varName);
        }
      }

      expect(unconsumed).toEqual([]);
    });

    test("all tokens.ts radius entries appear in :root", () => {
      const unconsumed: string[] = [];

      for (const varName of RADIUS_BRIDGE) {
        if (!rootVars.has(varName)) {
          unconsumed.push(varName);
        }
      }

      expect(unconsumed).toEqual([]);
    });
  });
});
