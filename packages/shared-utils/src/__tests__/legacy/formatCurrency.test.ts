import { formatCurrency } from '../../formatCurrency';

describe('formatCurrency', () => {
  it('uses USD and current locale by default', () => {
    const amount = 1234;
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
    expect(formatCurrency(amount)).toBe(expected);
  });

  it('formats valid currency codes', () => {
    const amount = 1234;
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
    expect(formatCurrency(amount, 'EUR', 'de-DE')).toBe(expected);
  });

  it.each(['INVALID', 'US', 'usd'])('throws for invalid ISO currency code %s', (code) => {
    expect(() => formatCurrency(100, code as any)).toThrow(RangeError);
  });

  it('throws when Intl.supportedValuesOf excludes the currency code', () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ['EUR'];
    try {
      expect(() => formatCurrency(100, 'USD')).toThrow(RangeError);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
      } else {
        delete (Intl as any).supportedValuesOf;
      }
    }
  });
});
