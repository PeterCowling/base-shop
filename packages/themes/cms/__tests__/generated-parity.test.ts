/**
 * Generated CSS Parity Test
 *
 * Proves that generateThemeCSS() with the CMS config produces CSS that
 * matches the committed generated file apps/cms/src/app/cms.tokens.generated.css.
 *
 * This is the permanent CI gate against token drift. The committed generated
 * file is the source of truth — if the compiler output diverges from it, the
 * test fails and the developer must either fix the config or regenerate.
 *
 * To regenerate:
 *   node --import tsx/esm packages/themes/cms/scripts/generate-tokens.ts
 */
import fs from "node:fs";
import path from "node:path";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";
import { themeCSSConfig } from "../src/theme-css-config";

// ---------------------------------------------------------------------------
// Load the committed generated file (source of truth for what's deployed)
// ---------------------------------------------------------------------------

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/cms/src/app/cms.tokens.generated.css",
);

const tokenCSS = fs.readFileSync(GENERATED_TOKENS_PATH, "utf8");

/**
 * Extract all CSS custom property declarations from a selector block.
 * Returns a Map of var name → value (trimmed).
 */
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
      if (depth === 0) { blockEnd = i; break; }
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

// Parse the committed generated tokens (the source of truth for what's deployed)
const existingRootVars = extractVarsFromBlock(tokenCSS, ":root");
const existingDarkVars = extractVarsFromBlock(tokenCSS, "html.theme-dark");

// Generate CSS fresh from the compiler
const generatedCSS = generateThemeCSS({
  assets,
  profile,
  config: themeCSSConfig,
});

// Parse the freshly generated CSS
const generatedRootVars = extractVarsFromBlock(generatedCSS, ":root");
const generatedDarkVars = extractVarsFromBlock(generatedCSS, "html.theme-dark");

// ---------------------------------------------------------------------------
// Sanity checks
// ---------------------------------------------------------------------------

describe("CMS generated token file structure", () => {
  test("generated file uses html.theme-dark selector (not .dark)", () => {
    expect(tokenCSS).toContain("html.theme-dark {");
    expect(tokenCSS).not.toContain(".dark {");
  });

  test("compiler output uses html.theme-dark selector (not .dark)", () => {
    expect(generatedCSS).toContain("html.theme-dark {");
    expect(generatedCSS).not.toContain(".dark {");
  });
});

// ---------------------------------------------------------------------------
// :root block coverage
// ---------------------------------------------------------------------------

describe("generateThemeCSS() output parity with cms.tokens.generated.css", () => {
  describe(":root — every committed var is present in fresh compiler output", () => {
    const rootEntries = Array.from(existingRootVars.entries()).filter(
      ([name]) => name.startsWith("--"),
    );

    test.each(rootEntries)(
      "%s exists in generated :root",
      (varName) => {
        expect(generatedRootVars.has(varName)).toBe(true);
      },
    );
  });

  describe(":root — values match", () => {
    const rootEntries = Array.from(existingRootVars.entries()).filter(
      ([name]) => name.startsWith("--"),
    );

    test.each(rootEntries)(
      "%s value matches",
      (varName, existingValue) => {
        const generatedValue = generatedRootVars.get(varName);
        expect(generatedValue).toBeDefined();

        // Normalise for comparison — collapse whitespace, lowercase
        const norm = (s: string) =>
          s.replace(/\s+/g, " ").trim().toLowerCase();

        expect(norm(generatedValue!)).toBe(norm(existingValue));
      },
    );
  });

  // ---------------------------------------------------------------------------
  // html.theme-dark block coverage
  // ---------------------------------------------------------------------------

  describe("html.theme-dark — every committed var is present in fresh compiler output", () => {
    const darkEntries = Array.from(existingDarkVars.entries()).filter(
      ([name]) => name.startsWith("--"),
    );

    test.each(darkEntries)(
      "%s exists in generated html.theme-dark",
      (varName) => {
        expect(generatedDarkVars.has(varName)).toBe(true);
      },
    );
  });

  describe("html.theme-dark — values match", () => {
    const darkEntries = Array.from(existingDarkVars.entries()).filter(
      ([name]) => name.startsWith("--"),
    );

    test.each(darkEntries)(
      "%s value matches",
      (varName, existingValue) => {
        const generatedValue = generatedDarkVars.get(varName);
        expect(generatedValue).toBeDefined();

        const norm = (s: string) =>
          s.replace(/\s+/g, " ").trim().toLowerCase();

        expect(norm(generatedValue!)).toBe(norm(existingValue));
      },
    );
  });

  // ---------------------------------------------------------------------------
  // No extra vars in generated output (inverse check)
  // ---------------------------------------------------------------------------

  describe("no unexpected vars in fresh compiler output", () => {
    test("generated :root has no vars absent from committed :root", () => {
      const extra: string[] = [];
      for (const [varName] of generatedRootVars) {
        if (!existingRootVars.has(varName)) {
          extra.push(varName);
        }
      }
      expect(extra).toEqual([]);
    });

    test("generated html.theme-dark has no vars absent from committed html.theme-dark", () => {
      const extra: string[] = [];
      for (const [varName] of generatedDarkVars) {
        if (!existingDarkVars.has(varName)) {
          extra.push(varName);
        }
      }
      expect(extra).toEqual([]);
    });
  });
});
