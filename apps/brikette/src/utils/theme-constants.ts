// src/utils/theme-constants.ts
// Theme constants (moved from src/root/theme.ts)

export const BRAND_PRIMARY_RGB: readonly [number, number, number] = [0, 98, 154];
export const BRAND_PRIMARY_DARK_RGB: readonly [number, number, number] = [159, 107, 0];

export const toRgb = (value: readonly [number, number, number]): string => `rgb(${value.join(", ")})`;
