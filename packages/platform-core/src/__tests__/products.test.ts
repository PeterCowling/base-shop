/** @jest-environment node */

import { jest } from '@jest/globals';
import { PRODUCTS } from '../products/index';

const serverMocks = {
  getProductById: jest.fn(async (_shop: string, id: string) =>
    PRODUCTS.find((p) => p.id === id) ?? null,
  ),
  readRepo: jest.fn(async () => PRODUCTS),
};

jest.mock('../repositories/products.server', () => serverMocks);

import {
  getProductBySlug,
  getProductById,
  getProducts,
  searchProducts,
} from '../products';

describe('getProductBySlug', () => {
  it('returns null for an unknown slug', () => {
    expect(getProductBySlug('non-existent')).toBeNull();
  });

  it('returns the product for a known slug', () => {
    const product = PRODUCTS[0];
    expect(getProductBySlug(product.slug)).toEqual(product);
  });
});

describe('getProductById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves with the matching product via async path', async () => {
    const product = PRODUCTS[0];
    await expect(getProductById('shop', product.id)).resolves.toEqual(
      product,
    );
    expect(serverMocks.getProductById).toHaveBeenCalledWith(
      'shop',
      product.id,
    );
  });

  it('returns the product synchronously when available', () => {
    const product = PRODUCTS[0];
    expect(getProductById(product.id)).toEqual(product);
    expect(serverMocks.getProductById).not.toHaveBeenCalled();
  });

  it('returns null for out-of-stock products', () => {
    const outOfStock = PRODUCTS.find((p) => p.stock === 0)!;
    expect(getProductById(outOfStock.id)).toBeNull();
  });

  it('returns null for unknown product ids', () => {
    expect(getProductById('missing-id')).toBeNull();
  });

  it('resolves null for unknown ids via async path', async () => {
    await expect(getProductById('shop', 'missing-id')).resolves.toBeNull();
    expect(serverMocks.getProductById).toHaveBeenCalledWith(
      'shop',
      'missing-id',
    );
  });
});

describe('getProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a copy of all products', async () => {
    const list = await getProducts();
    expect(list).toEqual(PRODUCTS);
    expect(list).not.toBe(PRODUCTS);
    expect(serverMocks.readRepo).not.toHaveBeenCalled();
  });

  it('delegates to the server when shop is provided', async () => {
    const list = await getProducts('shop');
    expect(serverMocks.readRepo).toHaveBeenCalledWith('shop');
    expect(list).toEqual(PRODUCTS);
  });

  it('applies valid sort and filter params', async () => {
    const list = await getProducts({ sort: 'price', filter: { size: '36' } });
    const expected = [...PRODUCTS]
      .filter((p) => p.sizes?.includes('36'))
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    expect(list).toEqual(expected);
  });

  it('defaults sort and ignores unknown filters', async () => {
    const list = await getProducts({
      sort: 'unknown' as any,
      filter: { size: '36', foo: 'bar' },
    });
    const expected = [...PRODUCTS]
      .filter((p) => p.sizes?.includes('36'))
      .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    expect(list).toEqual(expected);
  });

  it('ignores unrecognized filters entirely', async () => {
    const list = await getProducts({ sort: 'price', filter: { foo: 'bar' } });
    const expected = [...PRODUCTS].sort(
      (a, b) => (a.price ?? 0) - (b.price ?? 0),
    );
    expect(list).toEqual(expected);
  });
});

describe('searchProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty array when query yields no results', async () => {
    await expect(searchProducts('no-match')).resolves.toEqual([]);
    expect(serverMocks.readRepo).not.toHaveBeenCalled();
  });

    it('delegates to the server when shop is provided', async () => {
      const product = PRODUCTS[0];
      await expect(searchProducts('shop', product.title!)).resolves.toEqual([
        product,
      ]);
      expect(serverMocks.readRepo).toHaveBeenCalledWith('shop');
    });
  });
