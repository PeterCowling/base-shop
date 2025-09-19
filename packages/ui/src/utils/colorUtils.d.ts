export declare const HEX_RE: RegExp;
export declare const HSL_RE: RegExp;
export declare function isHex(value: string): boolean;
export declare function isHsl(value: string): boolean;
export declare function hslToHex(hsl: string): string;
export declare function hexToRgb(hex: string): [number, number, number];
export declare function getContrastColor(hex: string): "var(--color-fg)" | "var(--color-bg)";
export declare function hexToHsl(hex: string): string;
//# sourceMappingURL=colorUtils.d.ts.map
