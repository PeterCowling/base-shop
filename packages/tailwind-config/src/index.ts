// /packages/tailwind-config/src/index.ts
import type { Config } from "tailwindcss";

/* ------------------------------------------------------------
 *  Runtime diagnostics — confirm the preset really loads
 * ------------------------------------------------------------ */
// eslint-disable-next-line no-console
console.log(
  `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
);

const preset: Partial<Config> = {
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
};

// Additional diagnostics
// eslint-disable-next-line no-console
console.log("[@acme/tailwind-config] preset keys", Object.keys(preset));
// eslint-disable-next-line no-console
console.log(
  "[@acme/tailwind-config] has nested",
  {
    plugins: Array.isArray((preset as any).plugins),
    presets: Array.isArray((preset as any).presets),
  }
);

export default preset;
