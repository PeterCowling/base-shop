import { formatPrice } from '../../formatPrice.ts';

describe('formatPrice', () => {
  it('formats using USD by default', () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(1234);
    expect(formatPrice(1234)).toBe(expected);
  });

  it('formats specified currency and locale', () => {
    const expected = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(1234);
    expect(formatPrice(1234, 'EUR', 'de-DE')).toBe(expected);
  });

  it('throws for unsupported currency code when Intl.supportedValuesOf excludes it', () => {
    const original = (Intl as any).supportedValuesOf;
    (Intl as any).supportedValuesOf = () => ['EUR'];
    try {
      expect(() => formatPrice(10, 'USD')).toThrow(RangeError);
    } finally {
      if (original) {
        (Intl as any).supportedValuesOf = original;
      } else {
        delete (Intl as any).supportedValuesOf;
      }
    }
  });
});

