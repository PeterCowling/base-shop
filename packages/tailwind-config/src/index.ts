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
        muted: "hsl(var(--color-muted))",
      },
      textColor: {
        "primary-fg": "hsl(var(--color-primary-fg))",
        "accent-foreground": "hsl(var(--color-accent-fg))",
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
