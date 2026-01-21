import { getShopFromPath } from '@acme/lib/shop';

describe('getShopFromPath', () => {
  it('returns undefined for undefined input', () => {
    expect(getShopFromPath(undefined)).toBeUndefined();
  });

  it('prefers ?shop query parameter', () => {
    expect(getShopFromPath('/cms?shop=my-shop')).toBe('my-shop');
  });

  it('extracts slug from shop or shops segment', () => {
    expect(getShopFromPath('/cms/shop/example')).toBe('example');
    expect(getShopFromPath('/cms/shops/example')).toBe('example');
  });

  it('normalizes extra slashes', () => {
    expect(getShopFromPath('/cms//shop//example')).toBe('example');
  });

  it('returns undefined when no shop segment present', () => {
    expect(getShopFromPath('/cms/foo/bar')).toBeUndefined();
  });

  it('treats parameter-like segments as literal slugs', () => {
    expect(getShopFromPath('/cms/shop/[shop]')).toBe('[shop]');
    expect(getShopFromPath('/cms/shop/:shop')).toBe(':shop');
  });
});

