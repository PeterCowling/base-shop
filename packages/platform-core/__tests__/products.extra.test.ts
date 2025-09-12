import { jest } from '@jest/globals';
import { getProductById, getProducts, searchProducts } from '../src/products';
import * as base from '../src/products/index';

jest.mock('../src/repositories/products.server', () => ({
  getProductById: jest.fn(async (_shop: string, id: string) => base.getProductById(id) ?? null),
  readRepo: jest.fn(async (_shop: string) => base.PRODUCTS),
}));

describe('additional product scenarios', () => {
  const firstId = base.PRODUCTS[0].id;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to base product when repository call times out', async () => {
    const { getProductById: repoGet } = await import('../src/repositories/products.server');
    (repoGet as jest.Mock).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return null;
    });
    const product = await getProductById('shop', firstId);
    expect(product).toEqual(base.getProductById(firstId));
  });

  it('falls back to base product when repository call rejects', async () => {
    const { getProductById: repoGet } = await import('../src/repositories/products.server');
    (repoGet as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const product = await getProductById('shop', firstId);
    expect(product).toEqual(base.getProductById(firstId));
  });

  it('getProducts reads from repository when shop provided', async () => {
    const products = await getProducts('shop');
    expect(products).toEqual(base.PRODUCTS);
    const { readRepo } = await import('../src/repositories/products.server');
    expect(readRepo).toHaveBeenCalledWith('shop');
  });

  it('getProducts falls back to base on import failure', async () => {
    jest.resetModules();
    jest.doMock('../src/repositories/products.server', () => {
      throw new Error('fail');
    });
    const { getProducts } = await import('../src/products');
    const baseMod = await import('../src/products/index');
    const products = await getProducts('shop');
    expect(products).toEqual(baseMod.PRODUCTS);
  });

  it('searchProducts filters local products', async () => {
    const q = (base.PRODUCTS[0].title ?? '').slice(0, 2);
    const results = await searchProducts(q);
    expect(results.length).toBeGreaterThan(0);
  });

  it('searchProducts filters remote products', async () => {
    const q = (base.PRODUCTS[0].title ?? '').slice(0, 2);
    const results = await searchProducts('shop', q);
    expect(results.length).toBeGreaterThan(0);
    const { readRepo } = await import('../src/repositories/products.server');
    expect(readRepo).toHaveBeenCalledWith('shop');
  });

  it('searchProducts throws on empty query', async () => {
    await expect(searchProducts('')).rejects.toThrow('searchProducts requires a query string');
  });

  it('searchProducts throws on missing remote params', async () => {
    await expect(searchProducts('shop', '')).rejects.toThrow('searchProducts requires both shop and query string');
    await expect(searchProducts('', 'q')).rejects.toThrow('searchProducts requires both shop and query string');
  });

  it('searchProducts returns [] when repository import fails', async () => {
    jest.resetModules();
    jest.doMock('../src/repositories/products.server', () => {
      throw new Error('fail');
    });
    const { searchProducts } = await import('../src/products');
    const res = await searchProducts('shop', 'q');
    expect(res).toEqual([]);
  });
});
