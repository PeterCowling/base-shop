// /packages/tailwind-config/src/index.ts

// Avoid direct dependency on Tailwind's ESM-only type declarations
// to keep this package CommonJS compatible.
type Config = Record<string, unknown>;

/* ------------------------------------------------------------
 *  Runtime diagnostics — confirm the preset really loads
 * ------------------------------------------------------------ */
console.log(
  `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
);

const preset: Config = {
  // This preset only provides design tokens, so no files need to be scanned
  content: [],
  theme: {
    extend: {
      colors: {
        // Base semantic aliases expected by shadcn components
        background: "hsl(var(--color-bg))",
        foreground: "hsl(var(--color-fg))",
        card: "hsl(var(--color-bg))",
        popover: "hsl(var(--color-bg))",
        border: "hsl(var(--color-fg))",
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
      backgroundImage: {
        // Token-driven hero gradient
        hero:
          "linear-gradient(to right, hsl(var(--gradient-hero-from)), hsl(var(--gradient-hero-via)), hsl(var(--gradient-hero-to)))",
      },
      textColor: {
        // Core foreground aliases used across apps and shadcn
        foreground: "hsl(var(--color-fg))",
        "muted-foreground": "hsl(var(--color-fg) / 0.65)",
        "card-foreground": "hsl(var(--color-fg))",
        "popover-foreground": "hsl(var(--color-fg))",
        // Canonical foreground tokens
        "primary-foreground": "hsl(var(--color-primary-fg))",
        "accent-foreground": "hsl(var(--color-accent-fg))",
        "danger-foreground": "hsl(var(--color-danger-fg))",
        "success-foreground": "hsl(var(--color-success-fg))",
        "warning-foreground": "hsl(var(--color-warning-fg))",
        "info-foreground": "hsl(var(--color-info-fg))",
        // Aliases to support legacy `*-fg` usage across apps
        "primary-fg": "hsl(var(--color-primary-fg))",
        "accent-fg": "hsl(var(--color-accent-fg))",
        "danger-fg": "hsl(var(--color-danger-fg))",
        "success-fg": "hsl(var(--color-success-fg))",
        "warning-fg": "hsl(var(--color-warning-fg))",
        "info-fg": "hsl(var(--color-info-fg))",
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
  // Tailwind’s loader expects `presets` to be an array. Without this property,
  // it tries to read `.length` of `undefined` during `next build`, causing
  // “Cannot read properties of undefined (reading 'length')”.
  presets: [],
};

// Additional diagnostics
console.log("[@acme/tailwind-config] preset keys", Object.keys(preset));
console.log(
  "[@acme/tailwind-config] has nested",
  {
    plugins: Array.isArray((preset as { plugins?: unknown[] }).plugins),
    presets: Array.isArray((preset as { presets?: unknown[] }).presets),
  }
);

export default preset;
