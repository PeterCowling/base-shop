/** @jest-environment node */

jest.mock('../common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('@platform-core/repositories/json.server', () => ({
  readSettings: jest.fn(),
  readRepo: jest.fn(),
  writeRepo: jest.fn(),
  getProductById: jest.fn(),
  updateProductInRepo: jest.fn(),
  deleteProductFromRepo: jest.fn(),
  duplicateProductInRepo: jest.fn(),
}));

jest.mock('@/utils/sentry.server', () => ({
  captureException: jest.fn(),
}));

import { updateProduct, promoteProduct } from '../products.server';
import { ensureAuthorized } from '../common/auth';
import {
  readSettings,
  getProductById,
  updateProductInRepo,
} from '@platform-core/repositories/json.server';
import { captureException } from '@/utils/sentry.server';

describe('products.server', () => {
  const baseProduct = {
    id: 'p1',
    sku: 'sku1',
    title: { en: 'Old' },
    description: { en: 'Old desc' },
    price: 5,
    currency: 'EUR',
    media: [{ url: 'img.jpg', type: 'image' }],
    status: 'draft',
    shop: 'shop',
    row_version: 1,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureAuthorized as jest.Mock).mockResolvedValue(undefined);
    (readSettings as jest.Mock).mockResolvedValue({ languages: ['en'] });
    (updateProductInRepo as jest.Mock).mockImplementation((_shop, product) =>
      Promise.resolve(product)
    );
  });

  test('invalid media JSON falls back to []', async () => {
    (getProductById as jest.Mock).mockResolvedValue(baseProduct);
    const formData = new FormData();
    formData.append('id', 'p1');
    formData.append('price', '10');
    formData.append('title_en', 'New Title');
    formData.append('desc_en', 'New Desc');
    formData.append('media', 'not-json');

    const result = await updateProduct('shop', formData);

    expect(updateProductInRepo).toHaveBeenCalledWith(
      'shop',
      expect.objectContaining({ media: [] })
    );
    expect(result.product?.media).toEqual([]);
  });

  test('validation failure returns errors', async () => {
    const formData = new FormData();
    formData.append('id', 'p1');
    formData.append('price', '10');
    formData.append('title_en', '');
    formData.append('desc_en', 'Desc');
    formData.append('media', '[]');

    const result = await updateProduct('shop', formData);

    expect(result.errors).toBeDefined();
    expect(Object.keys(result.errors || {})).not.toHaveLength(0);
    expect(captureException).toHaveBeenCalled();
    expect(updateProductInRepo).not.toHaveBeenCalled();
    expect(getProductById).not.toHaveBeenCalled();
  });

  test('throws when product not found', async () => {
    (getProductById as jest.Mock).mockResolvedValue(undefined);
    const formData = new FormData();
    formData.append('id', 'p1');
    formData.append('price', '10');
    formData.append('title_en', 'Title');
    formData.append('desc_en', 'Desc');
    formData.append('media', '[]');

    await expect(updateProduct('shop', formData)).rejects.toThrow(
      'Product p1 not found in shop'
    );
    expect(updateProductInRepo).not.toHaveBeenCalled();
  });

  test('promoteProduct returns unchanged product when status final', async () => {
    const activeProduct = { ...baseProduct, status: 'active' };
    (getProductById as jest.Mock).mockResolvedValue(activeProduct);

    const result = await promoteProduct('shop', 'p1');

    expect(result).toBe(activeProduct);
    expect(updateProductInRepo).not.toHaveBeenCalled();
  });
});

