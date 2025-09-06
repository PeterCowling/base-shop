import { validateShopName } from '../src/validateShopName';

describe('validateShopName', () => {
  it('returns valid shop names unchanged', () => {
    expect(validateShopName('shop-name_123')).toBe('shop-name_123');
  });

  it('trims surrounding whitespace', () => {
    expect(validateShopName('  shop  ')).toBe('shop');
  });

  it('rejects names with uppercase, spaces, or symbols', () => {
    expect(() => validateShopName('BadName')).toThrow('Invalid shop name');
    expect(() => validateShopName('bad name')).toThrow('Invalid shop name');
    expect(() => validateShopName('bad/name')).toThrow('Invalid shop name');
  });

  it('rejects empty names', () => {
    expect(() => validateShopName('')).toThrow('Invalid shop name');
    expect(() => validateShopName('   ')).toThrow('Invalid shop name');
  });

  it('rejects names longer than 63 characters', () => {
    const longName = 'a'.repeat(64);
    expect(() => validateShopName(longName)).toThrow('Invalid shop name');
  });
});
