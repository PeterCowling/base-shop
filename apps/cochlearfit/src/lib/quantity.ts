export const MIN_QTY = 1;
export const MAX_QTY = 10;

export function clampQuantity(value: number): number {
  if (Number.isNaN(value)) return MIN_QTY;
  if (value < MIN_QTY) return MIN_QTY;
  if (value > MAX_QTY) return MAX_QTY;
  return Math.floor(value);
}
