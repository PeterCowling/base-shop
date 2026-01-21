import { formatPrice } from '@acme/lib/format';

describe('formatPrice', () => {
  const original = (Intl as any).supportedValuesOf;

  afterEach(() => {
    if (original) {
      (Intl as any).supportedValuesOf = original;
    } else {
      delete (Intl as any).supportedValuesOf;
    }
  });

  it('formats lowercase codes when supportedValuesOf absent', () => {
    delete (Intl as any).supportedValuesOf;
    const expected = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(12);
    expect(formatPrice(12, 'usd', 'en-US')).toBe(expected);
  });

  it('throws RangeError for unsupported currency when supportedValuesOf present', () => {
    (Intl as any).supportedValuesOf = () => ['USD'];
    expect(() => formatPrice(1, 'ABC')).toThrow(RangeError);
  });

  it('formats valid currency in provided locale', () => {
    (Intl as any).supportedValuesOf = () => ['USD', 'EUR'];
    const expected = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1);
    expect(formatPrice(1, 'EUR', 'de-DE')).toBe(expected);
  });
});

