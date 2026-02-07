import baseConfig from "../../tailwind.config.mjs";

/* eslint-disable ds/no-raw-font -- LINT-1007 [ttl=2026-12-31] Tailwind font stacks require literal fallback families */

const textShadowPlugin = ({ addUtilities }) => {
  addUtilities({
    ".text-shadow-sm": {
      "--tw-text-shadow-color": "rgba(0,0,0,0.25)",
      textShadow: "0 1px 2px var(--tw-text-shadow-color)",
    },
  });
};

const baseTheme = baseConfig.theme ?? {};
const baseExtend = baseTheme.extend ?? {};

/** @type {import('tailwindcss').Config} */
const config = {
  ...baseConfig,
  // `baseConfig.content` paths are relative to the repo root config file.
  // When this app runs from `apps/brikette`, Tailwind resolves globs relative
  // to this config file, so we need to remap them to point back to the mono-repo.
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "../../packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    // Exclude test files to avoid JIT generating CSS from test-only classes
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
    "!../../packages/eslint-plugin-ds/**",
    "!**/node_modules/**",
  ],
  theme: {
    ...baseTheme,
    extend: {
      ...baseExtend,
      fontFamily: {
        ...(baseExtend.fontFamily ?? {}),
        heading: ["var(--font-heading)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ...(baseExtend.colors ?? {}),
        brand: {
          bg: "rgb(var(--rgb-brand-bg) / <alpha-value>)",
          surface: "rgb(var(--rgb-brand-surface) / <alpha-value>)",
          text: "rgb(var(--rgb-brand-text) / <alpha-value>)",
          heading: "rgb(var(--rgb-brand-heading) / <alpha-value>)",
          primary: "rgb(var(--rgb-brand-primary) / <alpha-value>)",
          secondary: "rgb(var(--rgb-brand-secondary) / <alpha-value>)",
          terra: "rgb(var(--rgb-brand-terra) / <alpha-value>)",
          terracotta: "rgb(var(--rgb-brand-terra) / <alpha-value>)",
          bougainvillea: "rgb(var(--rgb-brand-bougainvillea) / <alpha-value>)",
          outline: "rgb(var(--rgb-brand-outline) / <alpha-value>)",
          muted: "rgb(var(--rgb-brand-muted) / <alpha-value>)",
          paragraph: "rgb(var(--rgb-brand-paragraph) / <alpha-value>)",
        },
      },
      aspectRatio: {
        ...(baseExtend.aspectRatio ?? {}),
        photo: "4 / 3",
      },
      spacing: {
        ...(baseExtend.spacing ?? {}),
        34: "8.5rem",
      },
      keyframes: {
        ...(baseExtend.keyframes ?? {}),
        "fade-up": {
          from: { opacity: "0", transform: "translateY(0.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-10%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "zoom-in-95": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "zoom-out-95": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
      },
      animation: {
        ...(baseExtend.animation ?? {}),
        "slide-down": "slide-down 250ms ease-out both",
        "fade-in": "fade-in 200ms ease-out both",
        "fade-out": "fade-out 150ms ease-in both",
        "fade-up": "fade-up 300ms ease-out both",
        "zoom-in-95": "zoom-in-95 200ms ease-out both",
        "zoom-out-95": "zoom-out-95 150ms ease-in both",
        in: "fade-in 200ms ease-out both",
        out: "fade-out 150ms ease-in both",
      },
      dropShadow: {
        ...(baseExtend.dropShadow ?? {}),
        "brand-primary-10": "0 8px 20px rgba(var(--rgb-brand-primary), 0.10)",
        "brand-primary-40": "0 10px 24px rgba(var(--rgb-brand-primary), 0.40)",
      },
    },
  },
  plugins: [...(baseConfig.plugins ?? []), textShadowPlugin],
};

export default config;
