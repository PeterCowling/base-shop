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
) as unknown;

export default designTokens;
export * from "./src/index";
