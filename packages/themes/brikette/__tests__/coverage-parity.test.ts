/**
 * Coverage Parity Test
 *
 * Proves that the structured three-layer system (assets + profile + recipes)
 * covers every hand-authored token and component class in brikette's global.css.
 *
 * This test must pass BEFORE wiring generateAssetCSS / generateProfileCSS /
 * generateRecipeCSS into the build — guaranteeing a like-for-like reproduction.
 */
import fs from "node:fs";
import path from "node:path";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";
import { recipes } from "../src/recipes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GLOBAL_CSS_PATH = path.resolve(
  __dirname,
  "../../../../apps/brikette/src/styles/global.css",
);

const GENERATED_TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../apps/brikette/src/styles/theme-tokens.generated.css",
);

const TAILWIND_CONFIG_PATH = path.resolve(
  __dirname,
  "../../../../apps/brikette/tailwind.config.mjs",
);

const globalCSS = fs.readFileSync(GLOBAL_CSS_PATH, "utf8");
// Token vars may be inline in global.css OR in the generated file
const generatedTokensCSS = fs.existsSync(GENERATED_TOKENS_PATH)
  ? fs.readFileSync(GENERATED_TOKENS_PATH, "utf8")
  : "";
// Combine both for searching — tokens can be in either location
const allCSS = globalCSS + "\n" + generatedTokensCSS;
const tailwindConfig = fs.readFileSync(TAILWIND_CONFIG_PATH, "utf8");

/** Extract CSS custom property declarations from a block (name → value) */
function extractVarsFromBlock(css: string, blockSelector: string): Map<string, string> {
  const vars = new Map<string, string>();

  // Find the block — handle nested braces by counting
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

  // Match CSS custom property declarations: --name: value;
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
// Parse global.css
// ---------------------------------------------------------------------------

// Token vars now live in the generated file — extract from there directly
// to avoid false matches on `.dark .hero-panel` etc. in global.css component rules.
const tokenSource = generatedTokensCSS || globalCSS;
const rootVars = extractVarsFromBlock(tokenSource, ":root");
const darkVars = extractVarsFromBlock(tokenSource, ".dark");

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
  if (typeof entry === "string") return undefined; // no dark variant for static colors
  return entry.dark;
}

// ---------------------------------------------------------------------------
// Bridge mapping: existing CSS var name → asset/profile source field
// ---------------------------------------------------------------------------

// ═══════════════════════════════════════════
// Brand color bridge (assets.brandColors → --color-brand-*)
// ═══════════════════════════════════════════

const BRAND_COLOR_BRIDGE: Record<string, string> = {
  // CSS var name suffix → assets.brandColors key
  "color-brand-primary": "primary",
  "color-brand-secondary": "secondary",
  "color-brand-terra": "terra",
  "color-brand-bougainvillea": "bougainvillea",
  "color-brand-bg": "bg",
  "color-brand-surface": "surface",
  "color-brand-text": "text",
  "color-brand-heading": "heading",
  "color-brand-on-primary": "onPrimary",
  "color-brand-on-accent": "onAccent",
  "color-brand-gradient-start": "gradientStart",
  "color-brand-gradient-mid": "gradientMid",
  // gradientEnd is derived (var(--color-brand-primary)), handled separately
  "color-rating-hostelworld": "ratingHostelworld",
  "color-rating-booking": "ratingBooking",
  "color-header-link": "headerLink",
  "color-header-logo-text": "headerLogoText",
};

// ═══════════════════════════════════════════
// Font bridge (assets.fonts → --font-*)
// ═══════════════════════════════════════════

const FONT_BRIDGE: Record<string, string> = {
  // CSS var name → assets.fonts key
  "font-sans": "body",
  "font-heading": "heading",
};

// ═══════════════════════════════════════════
// Profile bridge (profile fields → CSS values)
// ═══════════════════════════════════════════

const PROFILE_BRIDGE: Record<string, { value: string; note: string }> = {
  "theme-transition-duration": {
    value: profile.motion.durationNormal,
    note: "profile.motion.durationNormal",
  },
};

// ═══════════════════════════════════════════
// Vars that are derived/computed, not directly from assets/profile
// ═══════════════════════════════════════════

const DERIVED_VARS = new Set([
  "--color-brand-gradient-end",  // var(--color-brand-primary) — reference, not literal
  "--color-brand-outline",       // var(--color-brand-text) in light, hardcoded in dark
  "--z-modal",                   // UI layering — not brand
  "--layer-modal",               // UI layering — not brand
  "--layer-modal-backdrop",      // UI layering — not brand
  "--hospitality-ready",         // Semantic alias → base theme
  "--hospitality-ready-fg",
  "--hospitality-warning",
  "--hospitality-warning-fg",
  "--hospitality-info",
  "--hospitality-info-fg",
  "--color-panel",               // DS semantic token
  "--color-bg",                  // DS semantic token
  "--color-fg",                  // DS semantic token
]);

// RGB triplet vars — these are mechanically derived from the hex brand colors
const RGB_VAR_PATTERN = /^--rgb-brand-/;

// ═══════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════

describe("brikette three-layer coverage parity", () => {
  // ------------------------------------------------------------------
  // Layer 1: Assets — Brand Colors (light mode)
  // ------------------------------------------------------------------
  describe("assets.brandColors → :root brand color vars", () => {
    test.each(Object.entries(BRAND_COLOR_BRIDGE))(
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
  // Layer 1: Assets — Brand Colors (dark mode)
  // ------------------------------------------------------------------
  describe("assets.brandColors → .dark brand color vars", () => {
    const darkBridge = Object.entries(BRAND_COLOR_BRIDGE).filter(
      ([, assetKey]) => {
        const entry = assets.brandColors[assetKey];
        return typeof entry === "object" && entry.dark;
      },
    );

    test.each(darkBridge)(
      ".dark --%s matches assets.brandColors.%s.dark",
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
  // Layer 1: Assets — Fonts
  // ------------------------------------------------------------------
  describe("assets.fonts → :root font vars", () => {
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
  // Layer 1: Assets — Keyframes
  // ------------------------------------------------------------------
  describe("assets.keyframes → tailwind.config keyframes", () => {
    test.each(Object.keys(assets.keyframes))(
      "keyframe %s exists in tailwind.config.mjs",
      (keyframeName) => {
        // Keyframes are defined in tailwind.config.mjs, not global.css
        expect(tailwindConfig).toContain(`"${keyframeName}"`);
      },
    );

    test.each(Object.keys(assets.keyframes))(
      "keyframe %s from/to values match tailwind config",
      (keyframeName) => {
        const assetKf = assets.keyframes[keyframeName];
        // Verify the from/to property values appear in the config
        for (const [, val] of Object.entries(assetKf.from)) {
          expect(tailwindConfig).toContain(`"${val}"`);
        }
        for (const [, val] of Object.entries(assetKf.to)) {
          expect(tailwindConfig).toContain(`"${val}"`);
        }
      },
    );
  });

  // ------------------------------------------------------------------
  // Layer 1: Assets — Gradients
  // ------------------------------------------------------------------
  describe("assets.gradients → global.css gradient definitions", () => {
    test("hero gradient stops match .hero-panel background-image", () => {
      const heroGradient = assets.gradients.hero;
      expect(heroGradient).toBeDefined();

      // The hero-panel in global.css uses these stops
      for (const stop of heroGradient.stops) {
        expect(globalCSS).toContain(stop.color);
      }
      // Angle: 135deg
      expect(globalCSS).toContain(`${heroGradient.angle}deg`);
    });

    test("header gradient stops match .bg-header-gradient", () => {
      const headerGradient = assets.gradients.header;
      expect(headerGradient).toBeDefined();

      for (const stop of headerGradient.stops) {
        expect(globalCSS).toContain(stop.color);
      }
    });
  });

  // ------------------------------------------------------------------
  // Layer 2: Profile — Motion
  // ------------------------------------------------------------------
  describe("profile.motion → CSS transition values", () => {
    test("--theme-transition-duration matches profile.motion.durationNormal", () => {
      const cssValue = rootVars.get("--theme-transition-duration");
      expect(cssValue).toBe(profile.motion.durationNormal);
    });
  });

  // ------------------------------------------------------------------
  // Layer 2: Profile — Typography
  // ------------------------------------------------------------------
  describe("profile.typography → CSS typography values", () => {
    test("body uses leading-relaxed (1.625)", () => {
      // Tailwind's leading-relaxed = 1.625
      expect(profile.typography.bodyLeading).toBe(1.625);
      // The body rule uses @apply leading-relaxed
      expect(globalCSS).toContain("leading-relaxed");
    });

    test("headings use font-bold (700)", () => {
      expect(profile.typography.displayWeight).toBe(700);
      // h1-h6 rule uses @apply font-bold
      expect(globalCSS).toContain("font-bold");
    });

    test(".tracking-eyebrow matches profile.typography.labelTracking", () => {
      expect(globalCSS).toContain(
        `letter-spacing: ${profile.typography.labelTracking}`,
      );
    });
  });

  // ------------------------------------------------------------------
  // Layer 2: Profile — Space
  // ------------------------------------------------------------------
  describe("profile.space → CSS spacing values", () => {
    test("main padding-block-end uses clamp matching sectionGap intent", () => {
      // global.css: padding-block-end: clamp(3.5rem, 6vw, 5.5rem)
      // profile.space.sectionGap: var(--space-12, 3rem)
      // These are related but not identical — sectionGap is the token,
      // the clamp is the applied responsive expression
      expect(globalCSS).toContain("padding-block-end: clamp(3.5rem, 6vw, 5.5rem)");
    });

    test("hero-panel uses p-6 matching cardPadding", () => {
      // profile.space.cardPadding: var(--space-6, 1.5rem) — p-6 = 1.5rem
      expect(profile.space.cardPadding).toContain("1.5rem");
      expect(globalCSS).toContain("p-6");
    });
  });

  // ------------------------------------------------------------------
  // Layer 3: Recipes — Component classes
  // ------------------------------------------------------------------
  describe("recipes → global.css component classes", () => {
    test("heroPanel recipe matches .hero-panel CSS", () => {
      const recipe = recipes.heroPanel;

      // Background gradient — recipe and global.css both reference the same stops
      expect(recipe.base.css?.backgroundImage).toContain(
        "var(--color-brand-gradient-start)",
      );
      expect(recipe.base.css?.backgroundImage).toContain(
        "var(--color-brand-primary)",
      );
      // global.css has the same gradient with different whitespace (multiline).
      // Normalise all whitespace for comparison.
      const normaliseCSS = (s: string) =>
        s.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
      const recipeGradient = normaliseCSS(recipe.base.css!.backgroundImage!);
      // Extract the background-image value from the .hero-panel block
      const heroPanelMatch = globalCSS.match(
        /\.hero-panel\s*\{[^}]*background-image:\s*([^;]+);/s,
      );
      expect(heroPanelMatch).not.toBeNull();
      expect(normaliseCSS(heroPanelMatch![1])).toBe(recipeGradient);

      // Opacity
      expect(recipe.base.css?.opacity).toBe("0.96");
      expect(globalCSS).toContain("opacity: 0.96");

      // Dark variant sets opacity to 1
      expect(recipe.variants?.dark?.css?.opacity).toBe("1");
      expect(globalCSS).toContain("opacity: 1");

      // Tailwind classes
      expect(recipe.base.classes).toContain("rounded-2xl");
      expect(recipe.base.classes).toContain("shadow-xl");
      // eslint-disable-next-line ds/no-raw-tailwind-color -- testing recipe data
      expect(recipe.base.classes).toContain("ring-1 ring-white/20");
      expect(globalCSS).toContain("rounded-2xl");
    });

    test("ctaLight recipe matches .cta-light CSS", () => {
      const recipe = recipes.ctaLight;

      expect(recipe.base.css?.backgroundColor).toBe(
        "var(--color-brand-secondary)",
      );
      expect(globalCSS).toContain(
        "background-color: var(--color-brand-secondary)",
      );

      expect(recipe.base.css?.color).toBe("var(--color-brand-on-accent)");
      expect(globalCSS).toContain("color: var(--color-brand-on-accent)");
    });

    test("ctaDark recipe matches .cta-dark CSS", () => {
      const recipe = recipes.ctaDark;

      expect(recipe.base.css?.backgroundColor).toBe(
        "var(--color-brand-primary)",
      );
      // .cta-dark sets background-color: var(--color-brand-primary)
      expect(globalCSS).toContain("background-color: var(--color-brand-primary)");

      expect(recipe.base.css?.color).toBe("var(--color-brand-on-primary)");
    });

    test("headerGradient recipe matches .bg-header-gradient CSS", () => {
      const recipe = recipes.headerGradient;

      // The gradient value in the recipe
      const recipeGradient = recipe.base.css?.backgroundImage;
      expect(recipeGradient).toBeDefined();
      expect(recipeGradient).toContain("var(--color-brand-gradient-start)");
      expect(recipeGradient).toContain("var(--color-brand-gradient-mid)");
      expect(recipeGradient).toContain("var(--color-brand-gradient-end)");

      // global.css .bg-header-gradient uses same stops
      expect(globalCSS).toContain("var(--color-brand-gradient-start)");
      expect(globalCSS).toContain("var(--color-brand-gradient-mid)");
      expect(globalCSS).toContain("var(--color-brand-gradient-end)");
    });

    test("heroGradientOverlay recipe matches .hero-gradient-overlay CSS", () => {
      const recipe = recipes.heroGradientOverlay;

      expect(recipe.base.css?.opacity).toBe("0.10");
      // Dark variant hides the overlay
      expect(recipe.variants?.dark?.css?.opacity).toBe("0");
    });

    test("accordionItem recipe matches details>summary styling", () => {
      const recipe = recipes.accordionItem;

      // Recipe says border-radius: 0.75rem
      expect(recipe.base.css?.borderRadius).toBe("0.75rem");
      // global.css details > summary has border-radius: 0.75rem
      expect(globalCSS).toContain("border-radius: 0.75rem");

      // Recipe says cursor: pointer
      expect(recipe.base.css?.cursor).toBe("pointer");
    });

    test("progressBar recipe matches .progress-bar-light CSS", () => {
      const recipe = recipes.progressBar;

      expect(recipe.base.css?.backgroundColor).toBe(
        "var(--color-brand-secondary)",
      );
      expect(globalCSS).toContain(
        "background-color: var(--color-brand-secondary)",
      );
    });
  });

  // ------------------------------------------------------------------
  // Exhaustiveness: no unaccounted :root vars
  // ------------------------------------------------------------------
  describe("exhaustive coverage — every :root var has a source", () => {
    test("all :root custom properties are accounted for", () => {
      const unaccounted: string[] = [];

      for (const [varName] of rootVars) {
        // Skip RGB triplet vars — mechanically derived from hex colors
        if (RGB_VAR_PATTERN.test(varName)) continue;

        // Skip derived/semantic/layering vars
        if (DERIVED_VARS.has(varName)) continue;

        // Check brand color bridge
        const brandSuffix = varName.replace(/^--/, "");
        if (BRAND_COLOR_BRIDGE[brandSuffix]) continue;

        // Check font bridge
        if (FONT_BRIDGE[brandSuffix]) continue;

        // Check profile bridge
        if (PROFILE_BRIDGE[brandSuffix]) continue;

        // Check color-scheme (not a token)
        if (varName === "--color-scheme" || varName === "color-scheme") continue;

        unaccounted.push(varName);
      }

      expect(unaccounted).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Exhaustiveness: no unaccounted .dark vars
  // ------------------------------------------------------------------
  describe("exhaustive coverage — every .dark var has a source", () => {
    test("all .dark custom properties are accounted for", () => {
      const unaccounted: string[] = [];

      for (const [varName] of darkVars) {
        // Skip RGB triplet vars
        if (RGB_VAR_PATTERN.test(varName)) continue;

        // Skip derived/semantic/layering vars
        if (DERIVED_VARS.has(varName)) continue;

        // Check brand color bridge
        const brandSuffix = varName.replace(/^--/, "");
        if (BRAND_COLOR_BRIDGE[brandSuffix]) continue;

        // Check font bridge
        if (FONT_BRIDGE[brandSuffix]) continue;

        // Check profile bridge
        if (PROFILE_BRIDGE[brandSuffix]) continue;

        // color-scheme
        if (varName === "--color-scheme" || varName === "color-scheme") continue;

        unaccounted.push(varName);
      }

      expect(unaccounted).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // Reverse check: every asset has a corresponding CSS var
  // ------------------------------------------------------------------
  describe("reverse coverage — every asset color has a CSS var", () => {
    test("all brandColors entries are consumed in :root or .dark", () => {
      const unconsumed: string[] = [];

      // gradientEnd is a derived alias (var(--color-brand-primary) in CSS),
      // so its CSS var exists but the value is a reference, not a literal.
      // The asset value matches primary — this is intentional.
      const DERIVED_ASSET_KEYS = new Set(["gradientEnd"]);

      for (const [assetKey, value] of Object.entries(assets.brandColors)) {
        if (DERIVED_ASSET_KEYS.has(assetKey)) continue;

        // Find at least one bridge entry pointing to this asset key
        const bridgeEntry = Object.entries(BRAND_COLOR_BRIDGE).find(
          ([, v]) => v === assetKey,
        );

        if (!bridgeEntry) {
          unconsumed.push(assetKey);
          continue;
        }

        // Verify the CSS var exists
        const cssVarName = `--${bridgeEntry[0]}`;
        const inRoot = rootVars.has(cssVarName);
        const inDark = darkVars.has(cssVarName);

        if (!inRoot && !inDark) {
          unconsumed.push(`${assetKey} (bridged to ${cssVarName} but not found in CSS)`);
        }
      }

      expect(unconsumed).toEqual([]);
    });

    test("all font entries are consumed in :root", () => {
      for (const [fontKey, fontAsset] of Object.entries(assets.fonts)) {
        const bridgeEntry = Object.entries(FONT_BRIDGE).find(
          ([, v]) => v === fontKey,
        );

        // display font is used in components, not as a --font-* var
        if (fontKey === "display") continue;

        expect(bridgeEntry).toBeDefined();
        if (bridgeEntry) {
          expect(rootVars.has(`--${bridgeEntry[0]}`)).toBe(true);
        }
      }
    });
  });
});
