/**
 * Generated CSS Parity Test — xa-uploader
 *
 * Validates that the committed theme-tokens.generated.css matches what
 * postProcessGateCSS(generateThemeCSS(...)) would produce.
 *
 * This test is the ongoing guard against:
 *   - Regenerating the CSS and forgetting to commit the result.
 *   - Manually editing theme-tokens.generated.css (drift from source).
 *   - Changing assets.ts values without regenerating the CSS.
 *
 * Note: this test uses the post-processed output (no color-scheme,
 * --theme-transition-duration, or .dark block) — not raw generateThemeCSS() output.
 */
import fs from "node:fs";
import path from "node:path";

import { generateThemeCSS } from "@themes/base";

import { assets, postProcessGateCSS, profile, themeCSSConfig } from "../src";

// ---------------------------------------------------------------------------
// Load the committed generated CSS
// ---------------------------------------------------------------------------

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/xa-uploader/src/app/theme-tokens.generated.css",
);

const committedCSS = fs.readFileSync(GENERATED_TOKENS_PATH, "utf8");

/**
 * Extract all CSS custom property declarations from a selector block.
 * Returns a Map of var name → value (trimmed, whitespace-normalised).
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

/** Normalise whitespace and lowercase for value comparison */
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// ---------------------------------------------------------------------------
// Generate fresh output using same transformation the generator uses
// ---------------------------------------------------------------------------

const rawCSS = generateThemeCSS({ assets, profile, config: themeCSSConfig });
const generatedCSS = postProcessGateCSS(rawCSS);

// Parse both
const committedRootVars = extractVarsFromBlock(committedCSS, ":root");
const generatedRootVars = extractVarsFromBlock(generatedCSS, ":root");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("xa-uploader generated-parity: committed CSS matches compiler output", () => {
  // ------------------------------------------------------------------
  // :root — all committed vars exist in fresh generated output
  // ------------------------------------------------------------------
  describe(":root — every committed var is present in generated output", () => {
    const rootEntries = Array.from(committedRootVars.entries());

    test.each(rootEntries)(
      "%s exists in generated :root",
      (varName) => {
        expect(generatedRootVars.has(varName)).toBe(true);
      },
    );
  });

  describe(":root — values match (whitespace-normalised)", () => {
    const rootEntries = Array.from(committedRootVars.entries());

    test.each(rootEntries)(
      "%s value matches",
      (varName, committedValue) => {
        const generatedValue = generatedRootVars.get(varName);
        expect(generatedValue).toBeDefined();
        expect(norm(generatedValue!)).toBe(norm(committedValue));
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
        if (!committedRootVars.has(varName)) {
          extra.push(varName);
        }
      }
      expect(extra).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // No .dark block in committed file or generated output
  // ------------------------------------------------------------------
  test("committed CSS has no .dark block", () => {
    expect(committedCSS).not.toContain(".dark");
  });

  test("generated output has no .dark block after post-processing", () => {
    expect(generatedCSS).not.toContain(".dark");
  });

  // ------------------------------------------------------------------
  // No compiler extras in committed file
  // ------------------------------------------------------------------
  test("committed CSS has no color-scheme property", () => {
    expect(committedCSS).not.toMatch(/color-scheme\s*:/);
  });

  test("committed CSS has no --theme-transition-duration", () => {
    expect(committedCSS).not.toContain("--theme-transition-duration");
  });
});
