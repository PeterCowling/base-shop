import { getShopFromPath } from '../getShopFromPath';

describe('getShopFromPath', () => {
  it('returns undefined for an undefined path', () => {
    expect(getShopFromPath(undefined)).toBeUndefined();
  });

  it('extracts the slug from the ?shop query parameter', () => {
    expect(getShopFromPath('/cms?shop=my-shop')).toBe('my-shop');
    expect(getShopFromPath('?shop=my-shop')).toBe('my-shop');
    expect(getShopFromPath('/cms/shop/foo?shop=bar')).toBe('bar');
  });

  it('prefers the ?shop parameter over path segments', () => {
    expect(getShopFromPath('/cms/shop/foo?shop=bar')).toBe('bar');
    expect(getShopFromPath('/cms/shops/foo?shop=bar')).toBe('bar');
  });

  it('falls back to the path segment when the ?shop parameter is empty', () => {
    expect(getShopFromPath('/cms/shop/foo?shop=')).toBe('foo');
  });

  it('returns undefined when ?shop is empty and no path segment exists', () => {
    expect(getShopFromPath('?shop=')).toBeUndefined();
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

  it('handles paths with extra segments', () => {
    expect(getShopFromPath('/cms/shop/example/extra')).toBe('example');
    expect(getShopFromPath('/cms/shops/example/extra/more')).toBe('example');
  });

  it('returns undefined when there is no shop segment', () => {
    expect(getShopFromPath('/cms/pages')).toBeUndefined();
  });

  it('returns undefined for /cms/shop paths without a slug', () => {
    expect(getShopFromPath('/cms/shop')).toBeUndefined();
    expect(getShopFromPath('/cms/shop/')).toBeUndefined();
  });

  it('returns undefined for empty or invalid paths', () => {
    expect(getShopFromPath('')).toBeUndefined();
    expect(getShopFromPath('/')).toBeUndefined();
    expect(getShopFromPath('/cms/shops')).toBeUndefined();
  });

  it('handles paths with trailing slashes', () => {
    expect(getShopFromPath('/cms/shop/slug/')).toBe('slug');
  });

  it('handles full URLs with and without query strings', () => {
    expect(getShopFromPath('https://host/cms/shop/slug')).toBe('slug');
    expect(getShopFromPath('https://host/cms/shop/slug?foo=1')).toBe('slug');
    expect(getShopFromPath('https://host/cms?shop=my-shop')).toBe('my-shop');
  });
});
