import "server-only";
export declare function resolveDataRoot(): string;
export declare const DATA_ROOT: string;
/**
 * Load Tailwind design tokens for the given theme.
 * Falls back to an empty object when the theme does not
 * provide a `tailwind-tokens` module.
 */
export declare function loadThemeTokens(theme: string): Promise<Record<string, string>>;
//# sourceMappingURL=utils.d.ts.map