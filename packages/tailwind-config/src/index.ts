// /packages/tailwind-config/src/index.ts

// Avoid direct dependency on Tailwind's ESM-only type declarations
// to keep this package CommonJS compatible.
type Config = Record<string, unknown>;

/* ------------------------------------------------------------
 *  Runtime diagnostics — confirm the preset really loads
 * ------------------------------------------------------------ */
if (process.env.NODE_ENV !== "production") {
  // i18n-exempt: developer diagnostic log, not user-facing UI copy
  console.log(
    `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
  );
}

const preset: Config = {
  // This preset only provides design tokens, so no files need to be scanned
  content: [],
  theme: {
      // Lock Tailwind scales to DS tokens by defining full theme keys
      ringColor: {
        DEFAULT: "hsl(var(--color-focus-ring, var(--ring)))",
      },
      ringOffsetColor: {
        DEFAULT: "hsl(var(--ring-offset))",
      },
      colors: {
        // Provide a named ring color so `ring-ring` maps to the focus token
        ring: "hsl(var(--color-focus-ring, var(--ring)))",
        // Base semantic aliases expected by shadcn components
        background: "hsl(var(--color-bg))",
        foreground: "hsl(var(--color-fg))",
        // Surfaces (with safe fallbacks for apps that don't define surface tokens)
        "surface-1": "hsl(var(--surface-1, var(--color-bg)))",
        "surface-2": "hsl(var(--surface-2, var(--color-bg)))",
        "surface-3": "hsl(var(--surface-3, var(--color-bg)))",
        // Component surfaces
        card: "hsl(var(--surface-2, var(--color-panel, var(--color-bg))))",
        popover: "hsl(var(--surface-3, var(--color-panel, var(--color-bg))))",
        panel: "hsl(var(--color-panel, var(--surface-2, var(--color-bg))))",
        inset: "hsl(var(--color-inset, var(--surface-2, var(--color-bg))))",
        // Form input surface
        input: "hsl(var(--surface-input, var(--surface-2, var(--color-bg))))",
        border: "hsl(var(--color-fg))",
        "border-1": "hsl(var(--border-1, var(--color-fg) / 0.12))",
        "border-2": "hsl(var(--border-2, var(--color-fg) / 0.22))",
        "border-3": "hsl(var(--border-3, var(--color-fg) / 0.38))",
        // Legacy aliases used across apps
        bg: "hsl(var(--color-bg))",
        fg: "hsl(var(--color-fg))",
        primary: "hsl(var(--color-primary))",
        accent: "hsl(var(--color-accent))",
        // Alias destructive -> danger for shadcn compatibility
        destructive: "hsl(var(--color-danger))",
        danger: "hsl(var(--color-danger))",
        success: "hsl(var(--color-success))",
        warning: "hsl(var(--color-warning))",
        info: "hsl(var(--color-info))",
        muted: "hsl(var(--color-muted))",
        // Soft/tinted backgrounds
        "primary-soft": "hsl(var(--color-primary-soft, var(--color-primary) / 0.12))",
        "accent-soft": "hsl(var(--color-accent-soft, var(--color-accent) / 0.12))",
        "success-soft": "hsl(var(--color-success-soft, var(--color-success) / 0.12))",
        "info-soft": "hsl(var(--color-info-soft, var(--color-info) / 0.12))",
        "warning-soft": "hsl(var(--color-warning-soft, var(--color-warning) / 0.12))",
        "danger-soft": "hsl(var(--color-danger-soft, var(--color-danger) / 0.12))",
      },
      backgroundImage: {
        // Token-driven hero gradient
        hero:
          "linear-gradient(to right, hsl(var(--gradient-hero-from)), hsl(var(--gradient-hero-via)), hsl(var(--gradient-hero-to)))",
        // Contrast-safe variant: adds a dark overlay beneath text to guarantee legibility
        // across bright gradient stops. Use `bg-hero-contrast` instead of `bg-hero` when
        // placing body copy or headings directly on the hero background.
        'hero-contrast':
          "linear-gradient(hsl(var(--hero-contrast-overlay, 0 0% 0% / 0.55)), hsl(var(--hero-contrast-overlay, 0 0% 0% / 0.55))), linear-gradient(to right, hsl(var(--gradient-hero-from)), hsl(var(--gradient-hero-via)), hsl(var(--gradient-hero-to)))",
      },
      textColor: {
        // Core foreground aliases used across apps and shadcn
        foreground: "hsl(var(--color-fg))",
        // Muted foreground uses dedicated token
        "muted-foreground": "hsl(var(--color-fg-muted, var(--color-fg)))",
        "card-foreground": "hsl(var(--color-fg))",
        "popover-foreground": "hsl(var(--color-fg))",
        // Link color tuned for WCAG contrast on light surfaces
        link: "hsl(var(--color-link))",
        // Canonical foreground tokens
        "primary-foreground": "hsl(var(--color-primary-fg))",
        "accent-foreground": "hsl(var(--color-accent-fg))",
        // Hero foreground token pairs with `bg-hero-contrast` to maintain contrast
        "hero-foreground": "hsl(var(--hero-fg, 0 0% 100%))",
        // Alias destructive -> danger for shadcn compatibility
        "destructive-foreground": "hsl(var(--color-danger-fg))",
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
        // Elevation scale for consistent depth across apps
        'elevation-0': 'var(--elevation-0, none)',
        'elevation-1': 'var(--elevation-1, 0 1px 2px rgba(0,0,0,0.06))',
        'elevation-2': 'var(--elevation-2, 0 2px 6px rgba(0,0,0,0.10))',
        'elevation-3': 'var(--elevation-3, 0 4px 12px rgba(0,0,0,0.14))',
        'elevation-4': 'var(--elevation-4, 0 8px 24px rgba(0,0,0,0.18))',
        'elevation-5': 'var(--elevation-5, 0 12px 36px rgba(0,0,0,0.22))',
      },
  },
  plugins: [],
  // Tailwind’s loader expects `presets` to be an array. Without this property,
  // it tries to read `.length` of `undefined` during `next build`, causing
  // “Cannot read properties of undefined (reading 'length')”.
  presets: [],
};

// Additional diagnostics
if (process.env.NODE_ENV !== "production") {
  // i18n-exempt -- DS-000 ttl=2025-03-31
  console.log("[@acme/tailwind-config] preset keys", Object.keys(preset));
  // i18n-exempt -- DS-000 ttl=2025-03-31
  console.log(
    "[@acme/tailwind-config] has nested", // i18n-exempt -- DS-000 ttl=2025-03-31
    {
      plugins: Array.isArray((preset as { plugins?: unknown[] }).plugins),
      presets: Array.isArray((preset as { presets?: unknown[] }).presets),
    }
  );
}

export default preset;
