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
    readonly "--color-primary": {
        readonly light: "220 90% 56%";
        readonly dark: "220 90% 66%";
    };
    readonly "--color-primary-fg": {
        readonly light: "0 0% 100%";
        readonly dark: "0 0% 10%";
    };
    readonly "--color-accent": {
        readonly light: "260 83% 70%";
        readonly dark: "260 83% 70%";
    };
    readonly "--color-accent-fg": {
        readonly light: "0 0% 10%";
        readonly dark: "0 0% 10%";
    };
    readonly "--color-danger": {
        readonly light: "0 86% 97%";
        readonly dark: "0 63% 31%";
    };
    readonly "--color-danger-fg": {
        readonly light: "0 74% 42%";
        readonly dark: "0 93% 94%";
    };
    readonly "--color-success": {
        readonly light: "142 76% 97%";
        readonly dark: "142 72% 27%";
    };
    readonly "--color-success-fg": {
        readonly light: "142 72% 30%";
        readonly dark: "142 70% 94%";
    };
    readonly "--color-warning": {
        readonly light: "40 90% 96%";
        readonly dark: "35 90% 30%";
    };
    readonly "--color-warning-fg": {
        readonly light: "25 85% 31%";
        readonly dark: "40 90% 96%";
    };
    readonly "--color-info": {
        readonly light: "210 90% 96%";
        readonly dark: "210 90% 35%";
    };
    readonly "--color-info-fg": {
        readonly light: "210 90% 35%";
        readonly dark: "210 90% 96%";
    };
    readonly "--color-muted": {
        readonly light: "0 0% 88%";
        readonly dark: "0 0% 60%";
    };
    readonly "--font-sans": {
        readonly light: "\"Geist Sans\", system-ui, sans-serif";
    };
    readonly "--font-mono": {
        readonly light: "\"Geist Mono\", ui-monospace, monospace";
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
};
//# sourceMappingURL=tokens.d.ts.map