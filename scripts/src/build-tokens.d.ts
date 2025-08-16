export interface Token {
    readonly light: string;
    readonly dark?: string;
}
export type TokenMap = Record<`--${string}`, Token>;
export declare function generateStaticCss(map: TokenMap): string;
export declare function generateDynamicCss(map: TokenMap): string;
export declare function generateThemeCss(map: Record<string, string>): string;
