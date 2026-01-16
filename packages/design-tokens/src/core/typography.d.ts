/**
 * Core typography scales
 */
export declare const fontSizes: {
    readonly xs: "0.75rem";
    readonly sm: "0.875rem";
    readonly base: "1rem";
    readonly lg: "1.125rem";
    readonly xl: "1.25rem";
    readonly '2xl': "1.5rem";
    readonly '3xl': "1.875rem";
    readonly '4xl': "2.25rem";
    readonly '5xl': "3rem";
};
export declare const fontWeights: {
    readonly light: "300";
    readonly normal: "400";
    readonly medium: "500";
    readonly semibold: "600";
    readonly bold: "700";
};
export declare const lineHeights: {
    readonly none: "1";
    readonly tight: "1.25";
    readonly snug: "1.375";
    readonly normal: "1.5";
    readonly relaxed: "1.625";
    readonly loose: "2";
};
export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
export type LineHeight = keyof typeof lineHeights;
