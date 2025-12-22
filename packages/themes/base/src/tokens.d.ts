/**
 * Central colour-/spacing-/font-token catalogue.
 * Every token has a `light` value and may provide a `dark` variant.
 */
export interface Token {
    /** CSS colour / length / font list used in light mode */
    readonly light: string;
    /** Optional counterpart for dark mode */
    readonly dark?: string;
}
/** `--token-name`: `{ light, dark? }` */
export type TokenMap = Record<`--${string}`, Token>;
export declare const tokens: {
    readonly "--color-bg": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 4%";
    };
    readonly "--color-fg": {
        readonly light: "0 0% 10%";
        readonly dark: "0 0% 93%";
    };
    readonly "--color-bg-1": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 4%";
    };
    readonly "--color-bg-2": {
        readonly light: "0 0% 98%";
        readonly dark: "0 0% 6%";
    };
    readonly "--color-bg-3": {
        readonly light: "0 0% 96%";
        readonly dark: "0 0% 9%";
    };
    readonly "--color-bg-4": {
        readonly light: "0 0% 94%";
        readonly dark: "0 0% 12%";
    };
    readonly "--color-bg-5": {
        readonly light: "0 0% 92%";
        readonly dark: "0 0% 15%";
    };
    readonly "--color-panel": {
        readonly light: "0 0% 96%";
        readonly dark: "0 0% 12%";
    };
    readonly "--color-inset": {
        readonly light: "0 0% 98%";
        readonly dark: "0 0% 9%";
    };
    readonly "--color-border": {
        readonly light: "0 0% 80%";
        readonly dark: "0 0% 30%";
    };
    readonly "--color-border-strong": {
        readonly light: "0 0% 65%";
        readonly dark: "0 0% 45%";
    };
    readonly "--color-border-muted": {
        readonly light: "0 0% 88%";
        readonly dark: "0 0% 22%";
    };
    readonly "--color-fg-muted": {
        readonly light: "0 0% 40%";
        readonly dark: "0 0% 75%";
    };
    readonly "--surface-1": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 4%";
    };
    readonly "--surface-2": {
        readonly light: "0 0% 96%";
        readonly dark: "222 14% 13%";
    };
    readonly "--surface-3": {
        readonly light: "0 0% 92%";
        readonly dark: "222 12% 16%";
    };
    readonly "--surface-input": {
        readonly light: "0 0% 96%";
        readonly dark: "222 12% 18%";
    };
    readonly "--color-primary": {
        readonly light: "220 90% 56%";
        readonly dark: "220 90% 66%";
    };
    readonly "--color-primary-fg": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 10%";
    };
    readonly "--color-primary-soft": {
        readonly light: "220 90% 96%";
        readonly dark: "220 90% 18%";
    };
    readonly "--color-primary-hover": {
        readonly light: "220 90% 50%";
        readonly dark: "220 90% 72%";
    };
    readonly "--color-primary-active": {
        readonly light: "220 90% 45%";
        readonly dark: "220 90% 78%";
    };
    readonly "--color-accent": {
        readonly light: "260 83% 70%";
        readonly dark: "260 83% 70%";
    };
    readonly "--color-accent-fg": {
        readonly light: "0 0% 10%";
        readonly dark: "0 0% 10%";
    };
    readonly "--color-accent-soft": {
        readonly light: "260 83% 97%";
        readonly dark: "260 83% 20%";
    };
    readonly "--color-danger": {
        readonly light: "0 86% 97%";
        readonly dark: "0 63% 31%";
    };
    readonly "--color-danger-fg": {
        readonly light: "0 74% 42%";
        readonly dark: "0 93% 94%";
    };
    readonly "--color-danger-soft": {
        readonly light: "0 100% 98%";
        readonly dark: "0 50% 20%";
    };
    readonly "--color-success": {
        readonly light: "142 76% 97%";
        readonly dark: "142 72% 27%";
    };
    readonly "--color-success-fg": {
        readonly light: "142 72% 30%";
        readonly dark: "142 70% 94%";
    };
    readonly "--color-success-soft": {
        readonly light: "142 76% 96%";
        readonly dark: "142 60% 18%";
    };
    readonly "--color-warning": {
        readonly light: "40 90% 96%";
        readonly dark: "35 90% 30%";
    };
    readonly "--color-warning-fg": {
        readonly light: "25 85% 31%";
        readonly dark: "40 90% 96%";
    };
    readonly "--color-warning-soft": {
        readonly light: "40 90% 95%";
        readonly dark: "35 70% 20%";
    };
    readonly "--color-info": {
        readonly light: "210 90% 96%";
        readonly dark: "210 90% 35%";
    };
    readonly "--color-info-fg": {
        readonly light: "210 90% 35%";
        readonly dark: "210 90% 96%";
    };
    readonly "--color-info-soft": {
        readonly light: "210 90% 95%";
        readonly dark: "210 70% 20%";
    };
    readonly "--color-muted": {
        readonly light: "0 0% 88%";
        readonly dark: "0 0% 32%";
    };
    readonly "--color-link": {
        readonly light: "220 75% 40%";
        readonly dark: "220 80% 70%";
    };
    readonly "--color-focus-ring": {
        readonly light: "220 90% 56%";
        readonly dark: "220 90% 66%";
    };
    readonly "--ring": {
        readonly light: "220 90% 56%";
        readonly dark: "220 90% 66%";
    };
    readonly "--ring-offset": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 4%";
    };
    readonly "--ring-width": {
        readonly light: "2px";
    };
    readonly "--ring-offset-width": {
        readonly light: "2px";
    };
    readonly "--color-selection": {
        readonly light: "260 83% 92%";
        readonly dark: "220 30% 40%";
    };
    readonly "--color-highlight": {
        readonly light: "260 83% 97%";
        readonly dark: "220 25% 30%";
    };
    readonly "--color-muted-fg": {
        readonly light: "0 0% 20%";
        readonly dark: "0 0% 92%";
    };
    readonly "--color-muted-border": {
        readonly light: "0 0% 72%";
        readonly dark: "0 0% 40%";
    };
    readonly "--border-1": {
        readonly light: "var(--color-fg) / 0.12";
        readonly dark: "var(--color-fg) / 0.12";
    };
    readonly "--border-2": {
        readonly light: "var(--color-fg) / 0.22";
        readonly dark: "var(--color-fg) / 0.22";
    };
    readonly "--border-3": {
        readonly light: "var(--color-fg) / 0.38";
        readonly dark: "var(--color-fg) / 0.38";
    };
    readonly "--overlay-scrim-1": {
        readonly light: "0 0% 0% / 0.40";
        readonly dark: "0 0% 100% / 0.40";
    };
    readonly "--overlay-scrim-2": {
        readonly light: "0 0% 0% / 0.64";
        readonly dark: "0 0% 100% / 0.64";
    };
    readonly "--hero-fg": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 100%";
    };
    readonly "--font-sans": {
        readonly light: "var(--font-geist-sans)";
    };
    readonly "--font-mono": {
        readonly light: "var(--font-geist-mono)";
    };
    readonly "--font-body": {
        readonly light: "var(--font-sans)";
    };
    readonly "--font-heading-1": {
        readonly light: "var(--font-sans)";
    };
    readonly "--font-heading-2": {
        readonly light: "var(--font-sans)";
    };
    readonly "--typography-body-font-family": {
        readonly light: "var(--font-body)";
    };
    readonly "--text-heading-1-font-family": {
        readonly light: "var(--font-heading-1)";
    };
    readonly "--text-heading-2-font-family": {
        readonly light: "var(--font-heading-2)";
    };
    readonly "--space-1": {
        readonly light: "4px";
    };
    readonly "--space-2": {
        readonly light: "8px";
    };
    readonly "--space-3": {
        readonly light: "12px";
    };
    readonly "--space-4": {
        readonly light: "16px";
    };
    readonly "--radius-sm": {
        readonly light: "4px";
    };
    readonly "--radius-md": {
        readonly light: "8px";
    };
    readonly "--radius-lg": {
        readonly light: "12px";
    };
    readonly "--shadow-sm": {
        readonly light: "0 1px 2px 0 rgb(0 0 0 / 0.05)";
    };
    readonly "--shadow-md": {
        readonly light: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
    };
    readonly "--shadow-lg": {
        readonly light: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
    };
    readonly "--gradient-hero-from": {
        readonly light: "234 89% 60%";
    };
    readonly "--gradient-hero-via": {
        readonly light: "270 83% 60%";
    };
    readonly "--gradient-hero-to": {
        readonly light: "222 47% 11%";
    };
    readonly "--hero-contrast-overlay": {
        readonly light: "0 0% 0% / 0.55";
        readonly dark: "0 0% 0% / 0.55";
    };
};
//# sourceMappingURL=tokens.d.ts.map