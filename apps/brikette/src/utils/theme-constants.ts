// src/utils/theme-constants.ts
// Theme constants (moved from src/root/theme.ts)

export const BRAND_PRIMARY_RGB: readonly [number, number, number] = [0, 88, 135];
export const BRAND_PRIMARY_DARK_RGB: readonly [number, number, number] = [77, 168, 212];

export const toRgb = (value: readonly [number, number, number]): string => `rgb(${value.join(", ")})`;
