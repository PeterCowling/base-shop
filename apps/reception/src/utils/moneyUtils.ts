export function roundDownTo50Cents(value: number): number {
  return Math.floor(value * 2) / 2;
}
