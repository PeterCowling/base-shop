import plugin from "tailwindcss/plugin";

const designTokens = plugin.withOptions(
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
          muted: "hsl(var(--color-muted))",
        },
        textColor: {
          "primary-foreground": "hsl(var(--color-primary-fg))",
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
      },
    },
  })
);

export default designTokens;
