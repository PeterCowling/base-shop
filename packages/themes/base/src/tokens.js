// packages/themes/base/tokens.ts
/**
 * Central colour-/spacing-/font-token catalogue.
 * Every token has a `light` value and may provide a `dark` variant.
 */
export const tokens = {
    "--color-bg": { light: "0 0% 100%", dark: "0 0% 4%" },
    "--color-fg": { light: "0 0% 10%", dark: "0 0% 93%" },
    "--color-primary": { light: "220 90% 56%", dark: "220 90% 66%" },
    // Keep foreground on primary light in dark theme for adequate contrast
    "--color-primary-fg": { light: "0 0% 100%", dark: "0 0% 100%" },
    "--color-accent": { light: "260 83% 70%", dark: "260 83% 70%" },
    "--color-accent-fg": { light: "0 0% 10%", dark: "0 0% 10%" },
    "--color-danger": { light: "0 86% 97%", dark: "0 63% 31%" },
    "--color-danger-fg": { light: "0 74% 42%", dark: "0 93% 94%" },
    "--color-success": { light: "142 76% 97%", dark: "142 72% 27%" },
    "--color-success-fg": { light: "142 72% 30%", dark: "142 70% 94%" },
    "--color-warning": { light: "40 90% 96%", dark: "35 90% 30%" },
    "--color-warning-fg": { light: "25 85% 31%", dark: "40 90% 96%" },
    "--color-info": { light: "210 90% 96%", dark: "210 90% 35%" },
    "--color-info-fg": { light: "210 90% 35%", dark: "210 90% 96%" },
    "--color-muted": { light: "0 0% 88%", dark: "0 0% 60%" },
    "--font-sans": { light: 'var(--font-geist-sans)' },
    "--font-mono": { light: 'var(--font-geist-mono)' },
    "--space-1": { light: "4px" },
    "--space-2": { light: "8px" },
    "--space-3": { light: "12px" },
    "--space-4": { light: "16px" },
    "--radius-sm": { light: "4px" },
    "--radius-md": { light: "8px" },
    "--radius-lg": { light: "12px" },
    "--shadow-sm": { light: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
    "--shadow-md": {
        light: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    },
    "--shadow-lg": {
        light: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
};
