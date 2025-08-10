// packages/design-tokens/src/index.ts
import type { Config } from "tailwindcss";

/**
 * Tailwind preset shared across all workspace packages.
 * Since this package does not emit CSS directly, the `content`
 * array is intentionally left empty to satisfy Tailwind’s
 * `RequiredConfig` type without scanning any files here.
 */
const preset: Config = {
  content: [],

  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--color-bg))",
        fg: "hsl(var(--color-fg))",
        primary: "hsl(var(--color-primary))",
        accent: "hsl(var(--color-accent))",
        danger: "hsl(var(--color-danger))",
        muted: "hsl(var(--color-muted))",
      },
      textColor: {
        "primary-fg": "hsl(var(--color-primary-fg))",
        "accent-foreground": "hsl(var(--color-accent-fg))",
        "danger-foreground": "hsl(var(--color-danger-fg))",
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
};

export default preset;
