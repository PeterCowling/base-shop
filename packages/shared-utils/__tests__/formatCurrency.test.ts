import { formatCurrency } from '../src/formatCurrency';

describe('formatCurrency', () => {
  it('formats positive minor-unit amounts', () => {
    const minor = 12345; // $123.45
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(123.45);
    expect(formatCurrency(minor)).toBe(expected);
  });

  it('formats negative values', () => {
    const minor = -9876; // -$98.76
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(-98.76);
    expect(formatCurrency(minor)).toBe(expected);
  });

  it('formats zero correctly', () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(0);
    expect(formatCurrency(0)).toBe(expected);
  });

  it('handles large amounts', () => {
    const minor = 987654321; // $9,876,543.21
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(9876543.21);
    expect(formatCurrency(minor)).toBe(expected);
  });

  it('rounds fractional minor units', () => {
    const minor = 199.5; // -> $2.00 after rounding
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(2);
    expect(formatCurrency(minor)).toBe(expected);
  });

  it('formats using provided currency code and locale', () => {
    const minor = 12345; // €123.45
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(123.45);
    expect(formatCurrency(minor, 'EUR', 'de-DE')).toBe(expected);
  });

  it.each(['BAD', 'US', '', 'usd'])('throws RangeError for invalid currency %s', (code) => {
    expect(() => formatCurrency(100, code as any)).toThrow(RangeError);
  });

  it('uses explicit locale over default', () => {
    const minor = 12345; // $123.45
    const defaultFormatted = formatCurrency(minor, 'USD');
    const deFormatted = formatCurrency(minor, 'USD', 'de-DE');
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
    }).format(123.45);
    expect(deFormatted).toBe(expected);
    if (deFormatted !== defaultFormatted) {
      expect(deFormatted).not.toBe(defaultFormatted);
    }
  });

  it('throws RangeError when Intl.supportedValuesOf excludes the currency', () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ['USD'];
    try {
      expect(() => formatCurrency(100, 'EUR')).toThrow(RangeError);
    } finally {
      (Intl as any).supportedValuesOf = original;
    }
  });
});

