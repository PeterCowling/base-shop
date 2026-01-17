// packages/design-tokens/src/index.ts
import type { Config } from "tailwindcss";
export { colors } from "./core/colors";

// Removed dev console.log to avoid i18n lint noise

/**
 * Tailwind preset shared across all workspace packages.
 * Since this package does not emit CSS directly, the `content`
 * array is intentionally left empty to satisfy Tailwind’s
 * `RequiredConfig` type without scanning any files here.
 */
const preset: Config = {
  content: [],

  theme: {
      colors: {
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
      },
      textColor: {
        "primary-foreground": "hsl(var(--color-primary-fg))",
        "accent-foreground": "hsl(var(--color-accent-fg))",
        // Alias destructive -> danger for shadcn compatibility
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
};

export default preset;
