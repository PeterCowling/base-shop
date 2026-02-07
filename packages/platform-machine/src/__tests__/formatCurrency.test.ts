import { formatCurrency } from '@acme/lib/format';

describe('formatCurrency', () => {
  const original = (Intl as any).supportedValuesOf;

  afterEach(() => {
    if (original) {
      (Intl as any).supportedValuesOf = original;
    } else {
      delete (Intl as any).supportedValuesOf;
    }
  });

  it('formats valid currency when supportedValuesOf absent', () => {
    delete (Intl as any).supportedValuesOf;
    const expected = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1);
    expect(formatCurrency(100, 'USD', 'en-US')).toBe(expected);
  });

  it('throws RangeError for invalid codes', () => {
    expect(() => formatCurrency(100, 'EU' as any)).toThrow(RangeError);
    expect(() => formatCurrency(100, 'usd' as any)).toThrow(RangeError);
  });

  it('throws when supportedValuesOf excludes currency', () => {
    (Intl as any).supportedValuesOf = () => ['EUR'];
    expect(() => formatCurrency(100, 'USD')).toThrow(RangeError);
  });
});

