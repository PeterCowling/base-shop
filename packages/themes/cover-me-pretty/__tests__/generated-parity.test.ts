/**
 * Generated CSS Parity Test — cover-me-pretty
 *
 * Proves that generateThemeCSS() output matches the committed generated
 * theme-tokens.generated.css file. This is a generator-to-snapshot freshness
 * gate: if the source config changes without regenerating the committed file,
 * these tests will fail.
 *
 * cover-me-pretty is light-only. The committed file and generated output both
 * contain a .dark { color-scheme: dark; } block with no custom properties —
 * the inverse check will find no extra vars in .dark in either direction.
 */
import fs from "node:fs";
import path from "node:path";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";
import { themeCSSConfig } from "../src/theme-css-config";

// ---------------------------------------------------------------------------
// Load the committed generated tokens file (source of truth for deployment)
// ---------------------------------------------------------------------------

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/cover-me-pretty/src/app/theme-tokens.generated.css",
);

const tokenCSS = fs.readFileSync(GENERATED_TOKENS_PATH, "utf8");

/**
 * Extract all CSS custom property declarations from a selector block.
 * Returns a Map of var name -> value (trimmed).
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

// Parse the committed generated tokens
const existingRootVars = extractVarsFromBlock(tokenCSS, ":root");
const existingDarkVars = extractVarsFromBlock(tokenCSS, ".dark");

// Generate CSS fresh from the compiler
const generatedCSS = generateThemeCSS({
  assets,
  profile,
  config: themeCSSConfig,
});

// Parse the generated CSS
const generatedRootVars = extractVarsFromBlock(generatedCSS, ":root");
const generatedDarkVars = extractVarsFromBlock(generatedCSS, ".dark");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cover-me-pretty — generateThemeCSS() parity with committed theme-tokens.generated.css", () => {
  // ------------------------------------------------------------------
  // :root block — every committed var is present in generated output
  // ------------------------------------------------------------------
  describe(":root — every committed var is present in generated output", () => {
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

        // Normalise for comparison — collapse whitespace, lowercase hex
        const norm = (s: string) =>
          s.replace(/\s+/g, " ").trim().toLowerCase();

        expect(norm(generatedValue!)).toBe(norm(existingValue));
      },
    );
  });

  // ------------------------------------------------------------------
  // .dark block — cover-me-pretty is light-only; .dark has no custom props
  // The inverse check will trivially pass (empty -> empty).
  // ------------------------------------------------------------------
  describe(".dark — every committed var is present in generated output", () => {
    const darkEntries = Array.from(existingDarkVars.entries()).filter(
      ([name]) => name.startsWith("--"),
    );

    test.each(darkEntries)(
      "%s exists in generated .dark",
      (varName) => {
        expect(generatedDarkVars.has(varName)).toBe(true);
      },
    );
  });

  describe(".dark — values match", () => {
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

  // ------------------------------------------------------------------
  // No extra vars in generated output (inverse check)
  // ------------------------------------------------------------------
  describe("no unexpected vars in generated output", () => {
    test("generated :root has no vars absent from committed :root", () => {
      const extra: string[] = [];
      for (const [varName] of generatedRootVars) {
        if (!existingRootVars.has(varName)) {
          extra.push(varName);
        }
      }
      expect(extra).toEqual([]);
    });

    test("generated .dark has no vars absent from committed .dark", () => {
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
