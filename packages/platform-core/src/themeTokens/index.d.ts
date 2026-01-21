import { type TokenMap as ThemeTokenMap } from "@themes/base";

export type TokenMap = Record<keyof ThemeTokenMap, string>;
export declare const baseTokens: TokenMap;
export declare function loadThemeTokensNode(theme: string): TokenMap;
export declare function loadThemeTokensBrowser(theme: string): Promise<TokenMap>;
export declare function loadThemeTokens(theme: string): Promise<TokenMap>;
