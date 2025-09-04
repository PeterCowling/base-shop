import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('uses USD and current locale by default', () => {
    const amount = 1234;
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
    expect(formatCurrency(amount)).toBe(expected);
  });

  it('throws for invalid ISO currency codes', () => {
    expect(() => formatCurrency(100, 'INVALID')).toThrow(RangeError);
  });
});
