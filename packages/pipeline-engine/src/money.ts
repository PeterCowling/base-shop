export type Money = bigint;

const CENTS_PER_EURO = 100n;

export const money = {
  zero: 0n as Money,
  fromCents(value: number | bigint): Money {
    return BigInt(value);
  },
  fromEuros(value: number): Money {
    return BigInt(Math.round(value * 100));
  },
  toEuros(value: Money): number {
    return Number(value) / Number(CENTS_PER_EURO);
  },
  add(a: Money, b: Money): Money {
    return a + b;
  },
  subtract(a: Money, b: Money): Money {
    return a - b;
  },
  max(a: Money, b: Money): Money {
    return a > b ? a : b;
  },
  min(a: Money, b: Money): Money {
    return a < b ? a : b;
  },
  abs(value: Money): Money {
    return value < 0n ? -value : value;
  },
};
