import { formatPrice } from '../src/formatPrice';

describe('formatPrice', () => {
  it('formats positive amounts', () => {
    const amount = 123.45;
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    expect(formatPrice(amount)).toBe(expected);
  });

  it('formats negative amounts', () => {
    const amount = -98.76;
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    expect(formatPrice(amount)).toBe(expected);
  });

  it('formats zero', () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(0);
    expect(formatPrice(0)).toBe(expected);
  });

  it('handles large values', () => {
    const amount = 9876543.21;
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    expect(formatPrice(amount)).toBe(expected);
  });

  it('rounds to two decimals', () => {
    const amount = 1.005; // should round up to 1.01
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(1.01);
    expect(formatPrice(amount)).toBe(expected);
  });
});

