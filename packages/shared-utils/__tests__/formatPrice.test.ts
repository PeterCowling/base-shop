import { formatPrice } from '../src/formatPrice.ts';

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

  it('formats en-US numbers with comma separators', () => {
    const amount = 1234567.89;
    const formatted = formatPrice(amount, 'USD', 'en-US');
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    expect(formatted).toBe(expected);
    expect(formatted).toMatch(/1,234,567\.89/);
  });

  it('rounds to two decimals', () => {
    const amount = 1.005; // should round up to 1.01
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(1.01);
    expect(formatPrice(amount)).toBe(expected);
  });

  it('formats using provided currency code and locale', () => {
    const amount = 123.45;
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
    expect(formatPrice(amount, 'EUR', 'de-DE')).toBe(expected);
  });

  it('places currency symbol after amount for fr-FR locale', () => {
    const amount = 123.45;
    const formatted = formatPrice(amount, 'EUR', 'fr-FR');
    const expected = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
    expect(formatted).toBe(expected);
    expect(formatted.trim().endsWith('€')).toBe(true);
  });

  it.each(['BAD', 'US', '', 'usd'])('throws RangeError for invalid currency %s', (code) => {
    expect(() => formatPrice(1, code as any)).toThrow(RangeError);
  });

  it('throws unsupported currency code error when Intl.supportedValuesOf excludes the code', () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ['USD'];
    try {
      expect(() => formatPrice(1, 'EUR')).toThrow('Unsupported currency code: EUR');
    } finally {
      (Intl as any).supportedValuesOf = original;
    }
  });

  it('uses explicit locale over default', () => {
    const amount = 1234.56;
    const defaultFormatted = formatPrice(amount, 'USD');
    const deFormatted = formatPrice(amount, 'USD', 'de-DE');
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
    expect(deFormatted).toBe(expected);
    if (defaultFormatted !== deFormatted) {
      expect(deFormatted).not.toBe(defaultFormatted);
    }
  });

  it('formats currencies with zero fraction digits like JPY', () => {
    const amount = 123;
    const expected = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
    expect(formatPrice(amount, 'JPY', 'ja-JP')).toBe(expected);
  });

  it.each([undefined, NaN])('formats %s as NaN', (value) => {
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(NaN);
    expect(formatPrice(value as any)).toBe(expected);
  });

  it('delegates to Intl.NumberFormat with provided arguments', () => {
    const spy = jest.spyOn(Intl, 'NumberFormat');
    formatPrice(10, 'EUR', 'de-DE');
    expect(spy).toHaveBeenCalledWith('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
    spy.mockRestore();
  });
});

