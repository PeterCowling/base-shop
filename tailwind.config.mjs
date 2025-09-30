async function loadTailwindPreset() {
  try {
    const mod = await import("@acme/tailwind-config");
    return mod.default ?? mod;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "MODULE_NOT_FOUND" ||
        error.code === "ERR_MODULE_NOT_FOUND")
    ) {
      return {
        content: [],
        theme: {
          extend: {
            colors: {
              bg: "hsl(var(--color-bg))",
              fg: "hsl(var(--color-fg))",
              primary: "hsl(var(--color-primary))",
              accent: "hsl(var(--color-accent))",
              destructive: "hsl(var(--color-danger))",
              danger: "hsl(var(--color-danger))",
              success: "hsl(var(--color-success))",
              warning: "hsl(var(--color-warning))",
              info: "hsl(var(--color-info))",
              muted: "hsl(var(--color-muted))",
            },
            textColor: {
              "primary-foreground": "hsl(var(--color-primary-fg))",
              "accent-foreground": "hsl(var(--color-accent-fg))",
              "destructive-foreground": "hsl(var(--color-danger-fg))",
              "danger-foreground": "hsl(var(--color-danger-fg))",
              "success-foreground": "hsl(var(--color-success-fg))",
              "warning-foreground": "hsl(var(--color-warning-fg))",
              "info-foreground": "hsl(var(--color-info-fg))",
            },
            fontFamily: {
              sans: "var(--font-sans)",
              mono: "var(--font-mono)",
            },
            spacing: {
              0: "var(--space-0)",
              1: "var(--space-1)",
              2: "var(--space-2)",
              3: "var(--space-3)",
              4: "var(--space-4)",
              5: "var(--space-5)",
              6: "var(--space-6)",
              8: "var(--space-8)",
              10: "var(--space-10)",
              12: "var(--space-12)",
              16: "var(--space-16)",
            },
            borderRadius: {
              none: "var(--radius-none)",
              xs: "var(--radius-xs)",
              sm: "var(--radius-sm)",
              md: "var(--radius-md)",
              lg: "var(--radius-lg)",
              xl: "var(--radius-xl)",
              '2xl': "var(--radius-2xl)",
              '3xl': "var(--radius-3xl)",
              '4xl': "var(--radius-4xl)",
              full: "var(--radius-full)",
            },
            boxShadow: {
              sm: "var(--shadow-sm)",
              md: "var(--shadow-md)",
              lg: "var(--shadow-lg)",
            },
          },
        },
        plugins: [],
      };
    }
    throw error;
  }
}

async function loadDesignTokens() {
  try {
    const mod = await import("@acme/design-tokens");
    return mod.default ?? mod;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "MODULE_NOT_FOUND" ||
        error.code === "ERR_MODULE_NOT_FOUND")
    ) {
      const { default: plugin } = await import("tailwindcss/plugin");
      return plugin.withOptions(
        () => () => {},
        () => ({
          theme: {
            extend: {
              colors: {
                bg: "hsl(var(--color-bg))",
                fg: "hsl(var(--color-fg))",
                primary: "hsl(var(--color-primary))",
                accent: "hsl(var(--color-accent))",
                destructive: "hsl(var(--color-danger))",
                danger: "hsl(var(--color-danger))",
                success: "hsl(var(--color-success))",
                warning: "hsl(var(--color-warning))",
                info: "hsl(var(--color-info))",
                muted: "hsl(var(--color-muted))",
              },
              textColor: {
                "primary-foreground": "hsl(var(--color-primary-fg))",
                "accent-foreground": "hsl(var(--color-accent-fg))",
                "destructive-foreground": "hsl(var(--color-danger-fg))",
                "danger-foreground": "hsl(var(--color-danger-fg))",
                "success-foreground": "hsl(var(--color-success-fg))",
                "warning-foreground": "hsl(var(--color-warning-fg))",
                "info-foreground": "hsl(var(--color-info-fg))",
              },
              fontFamily: {
                sans: "var(--font-sans)",
                mono: "var(--font-mono)",
              },
              spacing: {
                0: "var(--space-0)",
                1: "var(--space-1)",
                2: "var(--space-2)",
                3: "var(--space-3)",
                4: "var(--space-4)",
                5: "var(--space-5)",
                6: "var(--space-6)",
                8: "var(--space-8)",
                10: "var(--space-10)",
                12: "var(--space-12)",
                16: "var(--space-16)",
              },
              borderRadius: {
                none: "var(--radius-none)",
                xs: "var(--radius-xs)",
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                '2xl': "var(--radius-2xl)",
                '3xl': "var(--radius-3xl)",
                '4xl': "var(--radius-4xl)",
                full: "var(--radius-full)",
              },
              boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
              },
            },
          },
        })
      );
    }
    throw error;
  }
}

const [rawPreset, tokens] = await Promise.all([
  loadTailwindPreset(),
  loadDesignTokens(),
]);

// Some presets may include an empty `preset`/`presets: []` key which Tailwind rejects.
// Sanitize by dropping empty preset arrays.
const preset = (() => {
  const p = { ...(rawPreset || {}) };
  // @ts-ignore - dynamic shape
  if (Array.isArray(p.preset) && p.preset.length === 0) delete p.preset;
  // @ts-ignore - dynamic shape
  if (Array.isArray(p.presets) && p.presets.length === 0) delete p.presets;
  return p;
})();

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [preset],
  darkMode: ["class", ".theme-dark"],
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    // Exclude test files and plugin test suites to avoid JIT generating CSS from test-only classes
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
    "!./packages/eslint-plugin-ds/**",
    "apps/storybook/.storybook/**/*.{ts,tsx,mdx}",
    "!**/node_modules",
    "!**/dist",
    "!**/.next",
  ],
  plugins: [
    tokens,
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
