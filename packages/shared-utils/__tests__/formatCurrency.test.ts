import { formatCurrency } from '../src/formatCurrency';

describe('formatCurrency', () => {
  it('formats cents to USD by default', () => {
    expect(formatCurrency(12345, 'USD', 'en-US')).toBe('$123.45');
  });

  it('supports other currencies and locales', () => {
    expect(formatCurrency(12345, 'EUR', 'en-US')).toBe('€123.45');
  });
});
