/**
 * Coverage Parity Test — xa-uploader
 *
 * Validates that every brandColors entry in assets.ts is correctly mapped
 * to a corresponding gate-* entry in themeCSSConfig.derivedVars.light,
 * AND that the 3 alpha-channel-only entries are present with expected values.
 *
 * This test is intentionally independent of post-process.ts — it works at
 * the TypeScript level only, without file I/O or CSS parsing. This means a
 * bug in the post-process helper cannot mask a coverage gap here.
 */
import { assets } from "../src/assets";
import { themeCSSConfig } from "../src/theme-css-config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert camelCase key to kebab-case (mirrors toKebab in theme-css-config.ts) */
function toKebab(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}

const derivedLight = themeCSSConfig.derivedVars!.light;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("xa-uploader coverage-parity: all tokens mapped in derivedVars.light", () => {
  // ------------------------------------------------------------------
  // 14 plain-color entries — derived from assets.brandColors
  // ------------------------------------------------------------------
  describe("brandColors entries — each appears in derivedVars.light with correct value", () => {
    const brandColorEntries = Object.entries(assets.brandColors);

    test.each(brandColorEntries)(
      "assets.brandColors.%s maps to gate-%s in derivedVars.light",
      (assetKey, value) => {
        const cssKey = `gate-${toKebab(assetKey)}`;
        const expectedValue = typeof value === "string" ? value : value.light;

        expect(derivedLight).toHaveProperty(cssKey);
        expect(derivedLight[cssKey]).toBe(expectedValue);
      },
    );
  });

  // ------------------------------------------------------------------
  // 3 alpha-channel entries — hardcoded directly in derivedVars.light
  // ------------------------------------------------------------------
  describe("alpha-channel entries — present with expected values", () => {
    test("gate-border is hsl(0 0% 10% / 0.22)", () => {
      expect(derivedLight["gate-border"]).toBe("hsl(0 0% 10% / 0.22)");
    });

    test("gate-header-border is hsl(0 0% 100% / 0.2)", () => {
      expect(derivedLight["gate-header-border"]).toBe("hsl(0 0% 100% / 0.2)");
    });

    test("gate-header-accent is hsl(190 70% 40% / 0.35)", () => {
      expect(derivedLight["gate-header-accent"]).toBe("hsl(190 70% 40% / 0.35)");
    });
  });

  // ------------------------------------------------------------------
  // Total count check — exactly 17 tokens (14 + 3)
  // ------------------------------------------------------------------
  test("derivedVars.light contains exactly 17 gate-* entries", () => {
    const gateKeys = Object.keys(derivedLight).filter((k) => k.startsWith("gate-"));
    expect(gateKeys).toHaveLength(17);
  });

  // ------------------------------------------------------------------
  // Sanity: no colorVarMap, fontVarMap, rgbVarMap entries
  // (ensures naming strategy is purely derivedVars)
  // ------------------------------------------------------------------
  test("colorVarMap is empty (all tokens use derivedVars.light to preserve --gate-* naming)", () => {
    expect(Object.keys(themeCSSConfig.colorVarMap)).toHaveLength(0);
  });

  test("fontVarMap is empty (no --font-* vars in xa-uploader)", () => {
    expect(Object.keys(themeCSSConfig.fontVarMap)).toHaveLength(0);
  });
});
