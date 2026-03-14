/**
 * Generated CSS Parity Test
 *
 * Proves that generateThemeCSS() produces CSS that matches the
 * hand-authored :root and .dark blocks in global.css.
 *
 * This is the final gate before switching global.css to use
 * generated output.
 */
import fs from "node:fs";
import path from "node:path";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";
import { themeCSSConfig } from "../src/theme-css-config";

// ---------------------------------------------------------------------------
// Load global.css and extract the :root and .dark blocks
// ---------------------------------------------------------------------------

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/brikette/src/styles/theme-tokens.generated.css",
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
const existingDarkVars = extractVarsFromBlock(tokenCSS, ".dark");

// Generate CSS from the compiler
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

describe("generateThemeCSS() output parity with global.css", () => {
  // ------------------------------------------------------------------
  // :root block coverage
  // ------------------------------------------------------------------
  describe(":root — every existing var is present in generated output", () => {
    const rootEntries = Array.from(existingRootVars.entries());

    // Skip `color-scheme` — it's a CSS property, not a custom property
    const customProps = rootEntries.filter(
      ([name]) => name.startsWith("--"),
    );

    test.each(customProps)(
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
  // .dark block coverage
  // ------------------------------------------------------------------
  describe(".dark — every existing var is present in generated output", () => {
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
    test("generated :root has no vars absent from existing :root", () => {
      const extra: string[] = [];
      for (const [varName] of generatedRootVars) {
        if (!existingRootVars.has(varName)) {
          extra.push(varName);
        }
      }
      expect(extra).toEqual([]);
    });

    test("generated .dark has no vars absent from existing .dark", () => {
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
