/** @jest-environment node */

jest.mock('@acme/platform-core/repositories/json.server', () => ({
  getProductById: jest.fn(),
  updateProductInRepo: jest.fn(),
}));

import { updateProduct } from '../updateProduct.server';
import { getProductById, updateProductInRepo } from '@acme/platform-core/repositories/json.server';

describe('updateProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates product with localized titles and price', async () => {
    const current = {
      id: 'p1',
      title: { en: 'Old EN', de: 'Old DE', it: 'Old IT' },
      price: 100,
      row_version: 1,
    };

    (getProductById as jest.Mock).mockResolvedValue(current);
    (updateProductInRepo as jest.Mock).mockImplementation((_shop: string, p: any) => Promise.resolve(p));

    const fd = new FormData();
    fd.append('id', 'p1');
    fd.append('price', '200');
    fd.append('title_en', 'New EN');
    fd.append('title_de', 'New DE');
    fd.append('title_it', 'New IT');

    const updated = await updateProduct(fd);

    expect(getProductById).toHaveBeenCalledWith('bcd', 'p1');
    expect(updateProductInRepo).toHaveBeenCalledWith('bcd', expect.any(Object));
    expect(updated.price).toBe(200);
    expect(updated.title.en).toBe('New EN');
    expect(updated.title.de).toBe('New DE');
    expect(updated.title.it).toBe('New IT');
    expect(updated.row_version).toBe(2);
  });

  it('retains existing titles when some fields are missing', async () => {
    const current = {
      id: 'p1',
      title: { en: 'Old EN', de: 'Old DE', it: 'Old IT' },
      price: 100,
      row_version: 1,
    };

    (getProductById as jest.Mock).mockResolvedValue(current);
    (updateProductInRepo as jest.Mock).mockImplementation((_shop: string, p: any) => Promise.resolve(p));

    const fd = new FormData();
    fd.append('id', 'p1');
    fd.append('price', '150');
    fd.append('title_en', 'New EN');
    // title_de and title_it are intentionally missing

    const updated = await updateProduct(fd);

    expect(updated.title.en).toBe('New EN');
    expect(updated.title.de).toBe('Old DE');
    expect(updated.title.it).toBe('Old IT');
  });

  it('sets price to 0 when the price field is missing', async () => {
    const current = {
      id: 'p1',
      title: { en: 'Old EN', de: 'Old DE', it: 'Old IT' },
      price: 100,
      row_version: 1,
    };

    (getProductById as jest.Mock).mockResolvedValue(current);
    (updateProductInRepo as jest.Mock).mockImplementation((_shop: string, p: any) => Promise.resolve(p));

    const fd = new FormData();
    fd.append('id', 'p1');
    fd.append('title_en', 'New EN');
    // price field is intentionally missing; Number(null) becomes 0

    const updated = await updateProduct(fd);

    // The current implementation converts missing price to 0
    expect(updated.price).toBe(0);
    expect(updated.title.en).toBe('New EN');
  });

  it('throws when product is missing', async () => {
    (getProductById as jest.Mock).mockResolvedValue(null);

    const fd = new FormData();
    fd.append('id', 'missing');

    await expect(updateProduct(fd)).rejects.toThrow('Product missing not found in shop bcd');
  });
});

