import { getShopFromPath } from '../getShopFromPath';

describe('getShopFromPath', () => {
  it('returns undefined for an undefined path', () => {
    expect(getShopFromPath(undefined)).toBeUndefined();
  });

  it('extracts the slug from the ?shop query parameter', () => {
    expect(getShopFromPath('/cms?shop=my-shop')).toBe('my-shop');
  });

  it('extracts the slug from /shop/:slug paths', () => {
    expect(getShopFromPath('/cms/shop/example')).toBe('example');
  });

  it('extracts the slug from /shops/:slug paths', () => {
    expect(getShopFromPath('/cms/shops/example')).toBe('example');
  });

  it('handles paths with extra slashes', () => {
    expect(getShopFromPath('/cms//shop//a')).toBe('a');
  });

  it('returns undefined when there is no shop segment', () => {
    expect(getShopFromPath('/cms/pages')).toBeUndefined();
  });

  it('returns undefined for /cms/shop paths without a slug', () => {
    expect(getShopFromPath('/cms/shop')).toBeUndefined();
    expect(getShopFromPath('/cms/shop/')).toBeUndefined();
  });

  it('extracts the slug from a full URL with query parameters', () => {
    expect(getShopFromPath('https://host/cms/shop/slug?foo=1')).toBe('slug');
  });
});

