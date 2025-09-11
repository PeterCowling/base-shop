import { formatCurrency } from '../src/formatCurrency.ts';

describe('formatCurrency', () => {
  it('formats using the runtime default locale when no locale is provided', () => {
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

  it('formats large values with grouping separators for en-US', () => {
    const minor = 1_000_000; // $10,000.00
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(10_000);
    const result = formatCurrency(minor, 'USD', 'en-US');
    expect(result).toBe(expected);
    expect(result).toContain(',');
  });

  it('rounds fractional minor units', () => {
    const minor = 199.5; // -> $2.00 after rounding
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(2);
    expect(formatCurrency(minor)).toBe(expected);
  });

  it('formats USD currency for the en-US locale', () => {
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(123.45);
    expect(formatCurrency(12345, 'USD', 'en-US')).toBe(expected);
  });

  it('formats using provided currency code and locale', () => {
    const minor = 12345; // €123.45
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(123.45);
    const result = formatCurrency(minor, 'EUR', 'de-DE');
    expect(result).toBe(expected);
    expect(result).toContain('€');
  });

  it("places the € symbol after the amount for 'de-DE'", () => {
    const result = formatCurrency(12345, 'EUR', 'de-DE');
    expect(result[result.length - 1]).toBe('€');
  });

  it('formats NaN or null amounts like Intl.NumberFormat', () => {
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(NaN);
    expect(formatCurrency(NaN, 'USD', 'en-US')).toBe(expected);
    expect(formatCurrency(null as any, 'USD', 'en-US')).toBe(expected);
  });

  it.each(['usd', 'US'])('throws RangeError for invalid currency %s', (code) => {
    expect(() => formatCurrency(100, code as any)).toThrow(
      new RangeError(`Invalid currency code: ${code}`)
    );
  });

  it('throws RangeError when Intl.supportedValuesOf excludes the currency', () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ['USD'];
    try {
      expect(() => formatCurrency(100, 'ABC')).toThrow(
        new RangeError('Invalid currency code: ABC')
      );
    } finally {
      (Intl as any).supportedValuesOf = original;
    }
  });
});

