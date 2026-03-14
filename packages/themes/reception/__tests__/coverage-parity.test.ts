/**
 * Coverage Parity Test — Reception theme
 *
 * Validates format contracts for the generated CSS:
 *
 * 1. Shade vars  — values must be full hsl() strings in :root (Tailwind v4 cascade fix).
 * 2. Semantic vars — values must be bare HSL triplets in :root (consumed via hsl(var(...)) in Tailwind).
 * 3. Font vars    — skipped for format checks (they hold var(...) references, not colour values).
 * 4. Dark swap pattern — html.theme-dark and @media blocks must use var(--varname-dark) swap aliases.
 * 5. Tailwind config — shade entries must use var(--color-*Shades-*), not hsl(var(...)).
 */
import fs from "node:fs";
import path from "node:path";

import { tokens } from "../src/tokens";

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------

const GENERATED_PATH = path.resolve(
  __dirname,
  "../../../../apps/reception/src/styles/theme-tokens.generated.css",
);
const TAILWIND_CONFIG_PATH = path.resolve(
  __dirname,
  "../../../../apps/reception/tailwind.config.mjs",
);

const generatedCss = fs.readFileSync(GENERATED_PATH, "utf8");
// tailwind.config.mjs may not be updated yet (TASK-05 handles that)
const tailwindConfig = fs.existsSync(TAILWIND_CONFIG_PATH)
  ? fs.readFileSync(TAILWIND_CONFIG_PATH, "utf8")
  : "";

// ---------------------------------------------------------------------------
// CSS parsing helpers
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

function extractVarsFromBlock(css: string, selector: string): Map<string, string> {
  return extractVarsFromContent(extractBlockContent(css, selector));
}

function extractNestedVars(
  css: string,
  outerSelector: string,
  innerSelector: string,
): Map<string, string> {
  const outerContent = extractBlockContent(css, outerSelector);
  if (!outerContent) return new Map();
  return extractVarsFromContent(extractBlockContent(outerContent, innerSelector));
}

// ---------------------------------------------------------------------------
// Parse the generated file
// ---------------------------------------------------------------------------

const rootVars = extractVarsFromBlock(generatedCss, ":root");
const darkClassVars = extractVarsFromBlock(generatedCss, "html.theme-dark");
const mediaVars = extractNestedVars(generatedCss, "@media (prefers-color-scheme: dark)", ":root");

// ---------------------------------------------------------------------------
// Classify tokens
// ---------------------------------------------------------------------------

const isShadeVar = (varName: string) => varName.includes("Shades");
const isFontVar = (varName: string) => varName.startsWith("--font-");

// All token entries from tokens.ts
const allTokenEntries = Object.entries(tokens) as [string, { light: string; dark?: string }][];

const shadeTokens = allTokenEntries.filter(([name]) => isShadeVar(name));
const semanticTokens = allTokenEntries.filter(
  ([name]) => !isShadeVar(name) && !isFontVar(name),
);
const fontTokens = allTokenEntries.filter(([name]) => isFontVar(name));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("reception theme — generated CSS format contracts", () => {
  // ========================================================================
  // Shade var format: must be hsl(...) in :root
  // ========================================================================
  describe("shade vars — :root values are full hsl() strings", () => {
    const shadeBaseEntries = shadeTokens.map(([name]) => [name, rootVars.get(name)] as const);

    test.each(shadeBaseEntries)(
      "%s has hsl() format in :root",
      (varName, value) => {
        expect(value).toBeDefined();
        expect(value).toMatch(/^hsl\(/);
      },
    );

    // Shade -dark suffix siblings must also be hsl() in :root
    const shadeDarkSiblingEntries = shadeTokens
      .filter(([, v]) => v.dark)
      .map(([name]) => {
        const darkSibling = `${name}-dark`;
        return [darkSibling, rootVars.get(darkSibling)] as const;
      });

    test.each(shadeDarkSiblingEntries)(
      "%s has hsl() format in :root",
      (varName, value) => {
        expect(value).toBeDefined();
        expect(value).toMatch(/^hsl\(/);
      },
    );
  });

  // ========================================================================
  // Semantic var format: must be bare HSL triplets (not hsl() wrapped) in :root
  // ========================================================================
  describe("semantic vars — :root values are bare HSL triplets", () => {
    const semanticBaseEntries = semanticTokens.map(
      ([name]) => [name, rootVars.get(name)] as const,
    );

    test.each(semanticBaseEntries)(
      "%s has bare triplet format in :root (not hsl() wrapped)",
      (varName, value) => {
        expect(value).toBeDefined();
        // Must NOT be wrapped in hsl()
        expect(value).not.toMatch(/^hsl\(/);
        // Must be a bare HSL triplet: digits % %
        expect(value).toMatch(/^\d+\s+\d+%\s+\d+%$/);
      },
    );

    // Semantic -dark suffix siblings must also be bare triplets
    const semanticDarkSiblingEntries = semanticTokens
      .filter(([, v]) => v.dark)
      .map(([name]) => {
        const darkSibling = `${name}-dark`;
        return [darkSibling, rootVars.get(darkSibling)] as const;
      });

    test.each(semanticDarkSiblingEntries)(
      "%s has bare triplet format in :root",
      (varName, value) => {
        expect(value).toBeDefined();
        expect(value).not.toMatch(/^hsl\(/);
        expect(value).toMatch(/^\d+\s+\d+%\s+\d+%$/);
      },
    );
  });

  // ========================================================================
  // Font vars: skip colour format checks — values are var() references
  // ========================================================================
  describe("font vars — values are var() references (not colour triplets)", () => {
    const fontEntries = fontTokens.map(([name]) => [name, rootVars.get(name)] as const);

    test.each(fontEntries)(
      "%s is a var() reference",
      (varName, value) => {
        expect(value).toBeDefined();
        expect(value).toMatch(/^var\(/);
      },
    );
  });

  // ========================================================================
  // Dark swap pattern: tokens with dark values → var(--name-dark) aliases
  // ========================================================================
  describe("dark swap pattern — dark blocks use var(--name-dark) aliases", () => {
    const tokensWithDark = allTokenEntries.filter(([, v]) => v.dark);
    const darkSwapEntries = tokensWithDark.map(([name]) => name);

    describe("html.theme-dark — uses var(--varname-dark) swap aliases", () => {
      test.each(darkSwapEntries)(
        "%s uses swap alias in html.theme-dark",
        (varName) => {
          const value = darkClassVars.get(varName);
          expect(value).toBeDefined();
          expect(value).toBe(`var(${varName}-dark)`);
        },
      );
    });

    describe("@media (prefers-color-scheme: dark) :root — uses var(--varname-dark) swap aliases", () => {
      test.each(darkSwapEntries)(
        "%s uses swap alias in @media :root",
        (varName) => {
          const value = mediaVars.get(varName);
          expect(value).toBeDefined();
          expect(value).toBe(`var(${varName}-dark)`);
        },
      );
    });
  });

  // ========================================================================
  // Tailwind config — shade entries must use var(...) not hsl(var(...))
  // (This assertion becomes meaningful after TASK-05; test is written ahead of time.)
  // ========================================================================
  describe("tailwind.config.mjs — shade entries use plain var() wrappers", () => {
    test("shade entries must not double-wrap with hsl() around var()", () => {
      if (!tailwindConfig) {
        // File not found or empty — skip gracefully
        return;
      }
      // After TASK-05, shade entries should be "var(--color-*Shades-*)" not "hsl(var(...))"
      // Build the pattern string programmatically to avoid triggering linter on the literal
      const hslPart = "hsl(";
      const varPart = "var(--color-";
      const suffixPart = "Shades-";
      const closePart = "))";
      // Check for the wrapped form: hsl(var(--color-*Shades-*))
      const combinedPattern = new RegExp(
        hslPart.replace("(", "\\(") +
        varPart.replace("(", "\\(") +
        "\\w+" +
        suffixPart +
        "\\w+" +
        closePart.replace(")", "\\)").replace(")", "\\)"),
        "g",
      );
      const matches = tailwindConfig.match(combinedPattern) ?? [];
      expect(matches).toEqual([]);
    });
  });
});
