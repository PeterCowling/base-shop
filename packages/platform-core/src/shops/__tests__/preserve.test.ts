import { getDomain, setDomain, type Shop, type ShopDomain } from '../index';

describe('setDomain preserves unrelated properties', () => {
  it('removes the domain when undefined and keeps other fields', () => {
    const base: Shop = { other: true };
    const domain: ShopDomain = { name: 'shop.example.com' };

    const withDomain = setDomain(base, domain);
    expect(getDomain(withDomain)).toEqual(domain);
    expect(withDomain.other).toBe(true);

    const cleared = setDomain(withDomain, undefined);
    expect(getDomain(cleared)).toBeUndefined();
    expect(cleared.other).toBe(true);
    expect('domain' in cleared).toBe(false);
    // original object unchanged
    expect(base).toEqual({ other: true });
  });
});
