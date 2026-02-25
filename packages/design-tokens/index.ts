import plugin from "tailwindcss/plugin";

export { colors } from "./src/core/colors";

const designTokens: unknown = plugin.withOptions(
  () => () => {},
  () => ({
    theme: {
      extend: {
        colors: {
          bg: "hsl(var(--color-bg))",
          fg: "hsl(var(--color-fg))",
          background: "hsl(var(--color-bg))",
          foreground: "hsl(var(--color-fg))",
          primary: "hsl(var(--color-primary))",
          "primary-foreground": "hsl(var(--color-primary-fg))",
          accent: "hsl(var(--color-accent))",
          "accent-foreground": "hsl(var(--color-accent-fg))",
          danger: "hsl(var(--color-danger))",
          "danger-foreground": "hsl(var(--color-danger-fg))",
          destructive: "hsl(var(--color-danger))",
          "destructive-foreground": "hsl(var(--color-danger-fg))",
          success: "hsl(var(--color-success))",
          "success-foreground": "hsl(var(--color-success-fg))",
          warning: "hsl(var(--color-warning))",
          "warning-foreground": "hsl(var(--color-warning-fg))",
          info: "hsl(var(--color-info))",
          "info-foreground": "hsl(var(--color-info-fg))",
          muted: "hsl(var(--color-muted))",
          "muted-foreground": "hsl(var(--color-fg-muted))",
          card: "hsl(var(--color-surface))",
          "card-foreground": "hsl(var(--color-fg))",
          border: "hsl(var(--color-border))",
          input: "hsl(var(--color-border))",
          ring: "hsl(var(--color-focus-ring))",
          panel: "hsl(var(--color-panel, var(--color-bg)))",
          surface: "hsl(var(--color-surface))",
        },
        textColor: {
          "primary-foreground": "hsl(var(--color-primary-fg))",
          "accent-foreground": "hsl(var(--color-accent-fg))",
          "danger-foreground": "hsl(var(--color-danger-fg))",
          "muted-foreground": "hsl(var(--color-fg-muted))",
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
      },
    },
  })
);

export default designTokens;
