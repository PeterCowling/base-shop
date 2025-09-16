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
              danger: "hsl(var(--color-danger))",
              success: "hsl(var(--color-success))",
              warning: "hsl(var(--color-warning))",
              info: "hsl(var(--color-info))",
              muted: "hsl(var(--color-muted))",
            },
            textColor: {
              "primary-foreground": "hsl(var(--color-primary-fg))",
              "accent-foreground": "hsl(var(--color-accent-fg))",
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
              1: "var(--space-1)",
              2: "var(--space-2)",
              3: "var(--space-3)",
              4: "var(--space-4)",
            },
            borderRadius: {
              sm: "var(--radius-sm)",
              md: "var(--radius-md)",
              lg: "var(--radius-lg)",
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
                danger: "hsl(var(--color-danger))",
                success: "hsl(var(--color-success))",
                warning: "hsl(var(--color-warning))",
                info: "hsl(var(--color-info))",
                muted: "hsl(var(--color-muted))",
              },
              textColor: {
                "primary-foreground": "hsl(var(--color-primary-fg))",
                "accent-foreground": "hsl(var(--color-accent-fg))",
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
                1: "var(--space-1)",
                2: "var(--space-2)",
                3: "var(--space-3)",
                4: "var(--space-4)",
              },
              borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
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

const [preset, tokens] = await Promise.all([
  loadTailwindPreset(),
  loadDesignTokens(),
]);

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [preset],
  darkMode: ["class", ".theme-dark"],
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx,mdx}",
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

