import { validateShopName } from '../src/validateShopName';

describe('validateShopName', () => {
  it('accepts valid shop names', () => {
    expect(validateShopName('shop-name_123')).toBe('shop-name_123');
  });

  it('trims surrounding whitespace', () => {
    expect(validateShopName('  shop  ')).toBe('shop');
  });

  it('throws for invalid names', () => {
    expect(() => validateShopName('bad name')).toThrow('Invalid shop name');
    expect(() => validateShopName('bad/name')).toThrow('Invalid shop name');
  });
});
