/**
 * Load the base Tailwind token mappings.
 *
 * The base theme defines tokens with optional dark variants. For the
 * create-shop script we only need the light values, so this reads the
 * TypeScript module and returns a plain mapping of token names to their
 * default (light) value.
 */
export declare function loadBaseTokens(): Record<string, string>;
/** Load theme tokens combined with base tokens. */
export declare function loadTokens(theme: string): Record<string, string>;
//# sourceMappingURL=themeUtils.d.ts.map