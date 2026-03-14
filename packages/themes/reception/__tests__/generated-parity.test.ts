/**
 * Generated CSS Parity Test — Reception theme
 *
 * Two cross-checks:
 *
 * Cross-check A  (tokens.css → committed generated file)
 *   Every var in the hand-authored tokens.css :root block must appear in the
 *   committed generated file with a semantically equivalent value.
 *   Shade vars: tokens.css stores bare triplets ("330 55% 66%") while the
 *   generated file wraps them in hsl() — normalise before comparing.
 *   Additive vars (color-scheme, --theme-transition-duration) may appear in
 *   the generated file but NOT in tokens.css — this is expected and allowed.
 *
 * Cross-check B  (committed generated file → compiler + post-processed output)
 *   Every var in the committed generated file must match the compiler output
 *   (after the dual-dark-block post-processing). Guards against committed file
 *   drifting from a fresh compiler run.
 */
import fs from "node:fs";
import path from "node:path";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";
import { themeCSSConfig } from "../src/theme-css-config";

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const TOKENS_CSS_PATH = path.resolve(__dirname, "../tokens.css");
const GENERATED_PATH = path.resolve(
  __dirname,
  "../../../../apps/reception/src/styles/theme-tokens.generated.css",
);

const tokensCss = fs.readFileSync(TOKENS_CSS_PATH, "utf8");
const generatedCss = fs.readFileSync(GENERATED_PATH, "utf8");

// ---------------------------------------------------------------------------
// Re-produce the post-processed compiler output (same logic as generate script)
// ---------------------------------------------------------------------------

function extractBlockContent(css: string, selector: string): string {
  const selectorIdx = css.indexOf(selector);
  if (selectorIdx === -1) return "";
  const openBrace = css.indexOf("{", selectorIdx);
  if (openBrace === -1) return "";

  let depth = 0;
  let blockEnd = -1;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) { blockEnd = i; break; }
    }
  }
  if (blockEnd === -1) return "";
  return css.slice(openBrace + 1, blockEnd);
}

function extractVarsFromContent(content: string): Map<string, string> {
  const vars = new Map<string, string>();
  const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    vars.set(`--${match[1]}`, match[2].trim());
  }
  return vars;
}

/** Extract vars from a named top-level selector block. */
function extractVarsFromBlock(css: string, selector: string): Map<string, string> {
  return extractVarsFromContent(extractBlockContent(css, selector));
}

/** Two-step extraction for @media :root — outer selector then inner. */
function extractNestedVars(
  css: string,
  outerSelector: string,
  innerSelector: string,
): Map<string, string> {
  const outerContent = extractBlockContent(css, outerSelector);
  if (!outerContent) return new Map();
  return extractVarsFromContent(extractBlockContent(outerContent, innerSelector));
}

// Reproduce generate-script post-processing on the fresh compiler output
const compilerRaw = generateThemeCSS({ assets, profile, config: themeCSSConfig });

const darkVarLines = extractBlockContent(compilerRaw, "html.theme-dark")
  .split("\n")
  .filter((l) => l.includes("--") && l.includes(":"));

const mediaBlock = [
  "@media (prefers-color-scheme: dark) {",
  "  :root {",
  ...darkVarLines.map((l) => `  ${l}`),
  "  }",
  "}",
].join("\n");

const themeDarkIdx = compilerRaw.indexOf("html.theme-dark {");
const recomputedCss = [
  compilerRaw.slice(0, themeDarkIdx),
  mediaBlock,
  "\n\n",
  compilerRaw.slice(themeDarkIdx),
].join("");

// ---------------------------------------------------------------------------
// Parse all three CSS sources
// ---------------------------------------------------------------------------

// From tokens.css (migration baseline)
const tokensRootVars = extractVarsFromBlock(tokensCss, ":root");
const tokensMediaVars = extractNestedVars(tokensCss, "@media (prefers-color-scheme: dark)", ":root");
const tokensDarkClassVars = extractVarsFromBlock(tokensCss, "html.theme-dark");

// From committed generated file
const generatedRootVars = extractVarsFromBlock(generatedCss, ":root");
const generatedMediaVars = extractNestedVars(generatedCss, "@media (prefers-color-scheme: dark)", ":root");
const generatedDarkClassVars = extractVarsFromBlock(generatedCss, "html.theme-dark");

// From recomputed compiler output
const recomputedRootVars = extractVarsFromBlock(recomputedCss, ":root");
const recomputedMediaVars = extractNestedVars(recomputedCss, "@media (prefers-color-scheme: dark)", ":root");
const recomputedDarkClassVars = extractVarsFromBlock(recomputedCss, "html.theme-dark");

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** For Cross-check A: shade vars in tokens.css are bare triplets; in generated file they
 *  are wrapped in hsl(). Normalise for equivalence check. */
function normForCrossCheckA(varName: string, tokensCssValue: string): string {
  const isShade = varName.includes("Shades");
  if (isShade) {
    // tokens.css: "330 55% 66%" → should match generated "hsl(330 55% 66%)"
    // Normalise both sides to bare triplet for comparison
    return norm(tokensCssValue);
  }
  return norm(tokensCssValue);
}

function normGeneratedForCrossCheckA(varName: string, generatedValue: string): string {
  const isShade = varName.includes("Shades");
  if (isShade) {
    // Strip hsl() wrapper for comparison
    const stripped = generatedValue.replace(/^hsl\(\s*/, "").replace(/\s*\)$/, "");
    return norm(stripped);
  }
  return norm(generatedValue);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Known additive vars — present in generated file but NOT in tokens.css.
// Cross-check A must not fail because of these.
const ADDITIVE_VARS = new Set(["--theme-transition-duration"]);

describe("reception theme — generated CSS parity", () => {
  // ========================================================================
  // Cross-check A: tokens.css → committed generated file
  // ========================================================================
  describe("Cross-check A: tokens.css → generated file (all vars preserved)", () => {
    const tokensEntries = Array.from(tokensRootVars.entries()).filter(
      ([name]) => name.startsWith("--"),
    );

    describe(":root — every tokens.css var present in generated file", () => {
      test.each(tokensEntries)(
        "%s exists in generated :root",
        (varName) => {
          expect(generatedRootVars.has(varName)).toBe(true);
        },
      );
    });

    describe(":root — values match (accounting for shade hsl() wrapping)", () => {
      test.each(tokensEntries)(
        "%s value matches",
        (varName, tokensCssValue) => {
          const generatedValue = generatedRootVars.get(varName);
          expect(generatedValue).toBeDefined();
          expect(normGeneratedForCrossCheckA(varName, generatedValue!)).toBe(
            normForCrossCheckA(varName, tokensCssValue),
          );
        },
      );
    });

    test("additive vars only allowed additions in generated file", () => {
      const unexpected: string[] = [];
      for (const [varName] of generatedRootVars) {
        if (!tokensRootVars.has(varName) && !ADDITIVE_VARS.has(varName)) {
          unexpected.push(varName);
        }
      }
      expect(unexpected).toEqual([]);
    });
  });

  // ========================================================================
  // Cross-check B: committed generated file → recomputed compiler output
  // ========================================================================
  describe("Cross-check B: committed generated file → compiler output (no drift)", () => {
    // :root block
    describe(":root — generated vars match compiler", () => {
      const generatedEntries = Array.from(generatedRootVars.entries()).filter(
        ([name]) => name.startsWith("--"),
      );

      test.each(generatedEntries)(
        "%s matches compiler :root",
        (varName, generatedValue) => {
          const recomputedValue = recomputedRootVars.get(varName);
          expect(recomputedValue).toBeDefined();
          expect(norm(recomputedValue!)).toBe(norm(generatedValue));
        },
      );

      test("no extra vars in compiler :root absent from committed file", () => {
        const extra: string[] = [];
        for (const [varName] of recomputedRootVars) {
          if (!generatedRootVars.has(varName)) {
            extra.push(varName);
          }
        }
        expect(extra).toEqual([]);
      });
    });

    // @media (prefers-color-scheme: dark) :root block
    describe("@media dark :root — generated vars match compiler", () => {
      const mediaEntries = Array.from(generatedMediaVars.entries()).filter(
        ([name]) => name.startsWith("--"),
      );

      test.each(mediaEntries)(
        "%s matches compiler @media :root",
        (varName, generatedValue) => {
          const recomputedValue = recomputedMediaVars.get(varName);
          expect(recomputedValue).toBeDefined();
          expect(norm(recomputedValue!)).toBe(norm(generatedValue));
        },
      );

      test("@media block vars match tokens.css @media block", () => {
        const tokensMediaEntries = Array.from(tokensMediaVars.entries());
        for (const [varName, tokensCssValue] of tokensMediaEntries) {
          if (!varName.startsWith("--")) continue;
          const generatedValue = generatedMediaVars.get(varName);
          expect(generatedValue).toBeDefined();
          expect(norm(generatedValue!)).toBe(norm(tokensCssValue));
        }
      });
    });

    // html.theme-dark block
    describe("html.theme-dark — generated vars match compiler", () => {
      const darkClassEntries = Array.from(generatedDarkClassVars.entries()).filter(
        ([name]) => name.startsWith("--"),
      );

      test.each(darkClassEntries)(
        "%s matches compiler html.theme-dark",
        (varName, generatedValue) => {
          const recomputedValue = recomputedDarkClassVars.get(varName);
          expect(recomputedValue).toBeDefined();
          expect(norm(recomputedValue!)).toBe(norm(generatedValue));
        },
      );

      test("html.theme-dark block vars match tokens.css html.theme-dark block", () => {
        const tokensDarkEntries = Array.from(tokensDarkClassVars.entries());
        for (const [varName, tokensCssValue] of tokensDarkEntries) {
          if (!varName.startsWith("--")) continue;
          const generatedValue = generatedDarkClassVars.get(varName);
          expect(generatedValue).toBeDefined();
          expect(norm(generatedValue!)).toBe(norm(tokensCssValue));
        }
      });
    });
  });

  // ========================================================================
  // Dark block shape: @media and html.theme-dark have the same var set
  // ========================================================================
  describe("dual dark blocks — @media and html.theme-dark are consistent", () => {
    test("both dark blocks contain the same vars", () => {
      const mediaVarNames = new Set(
        Array.from(generatedMediaVars.keys()).filter((k) => k.startsWith("--")),
      );
      const darkClassVarNames = new Set(
        Array.from(generatedDarkClassVars.keys()).filter((k) => k.startsWith("--")),
      );

      const inMediaOnly = [...mediaVarNames].filter((k) => !darkClassVarNames.has(k));
      const inDarkOnly = [...darkClassVarNames].filter((k) => !mediaVarNames.has(k));

      expect(inMediaOnly).toEqual([]);
      expect(inDarkOnly).toEqual([]);
    });

    test("both dark blocks have the same values", () => {
      for (const [varName, mediaValue] of generatedMediaVars) {
        if (!varName.startsWith("--")) continue;
        const darkClassValue = generatedDarkClassVars.get(varName);
        expect(darkClassValue).toBeDefined();
        expect(norm(darkClassValue!)).toBe(norm(mediaValue));
      }
    });
  });
});
