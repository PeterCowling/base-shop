const BRAND_PRIMARY_RGB: readonly [number, number, number] = [0, 98, 154];
const BRAND_PRIMARY_DARK_RGB: readonly [number, number, number] = [159, 107, 0];

const toRgb = (value: readonly [number, number, number]): string => `rgb(${value.join(", ")})`;

export { BRAND_PRIMARY_DARK_RGB, BRAND_PRIMARY_RGB, toRgb };
