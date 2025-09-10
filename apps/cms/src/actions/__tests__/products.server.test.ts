/** @jest-environment node */

jest.mock('../common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@platform-core/repositories/json.server', () => ({
  readSettings: jest.fn(),
  readRepo: jest.fn(),
  writeRepo: jest.fn(),
  getProductById: jest.fn(),
  updateProductInRepo: jest.fn(),
  duplicateProductInRepo: jest.fn(),
  deleteProductFromRepo: jest.fn(),
}));

jest.mock('@/utils/sentry.server', () => ({
  captureException: jest.fn(),
}));

import {
  createDraftRecord,
  createDraft,
  updateProduct,
  duplicateProduct,
  deleteProduct,
  promoteProduct,
} from '../products.server';
import { ensureAuthorized } from '../common/auth';
import {
  readSettings,
  readRepo,
  writeRepo,
  getProductById,
  updateProductInRepo,
  duplicateProductInRepo,
  deleteProductFromRepo,
} from '@platform-core/repositories/json.server';
import { redirect } from 'next/navigation';
import { captureException } from '@/utils/sentry.server';
import { productSchema } from '../schemas';

describe('products.server actions', () => {
  const shop = 'shop1';
  const baseProduct = {
    id: 'p1',
    sku: 'sku1',
    title: { en: 't' },
    description: { en: 'd' },
    price: 5,
    currency: 'EUR',
    media: [{ url: 'm', type: 'image' }],
    status: 'draft',
    shop,
    row_version: 1,
    created_at: '2020-01-01',
    updated_at: '2020-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureAuthorized as jest.Mock).mockResolvedValue(undefined);
    (readSettings as jest.Mock).mockResolvedValue({ languages: ['en'] });
    (readRepo as jest.Mock).mockResolvedValue([]);
    (writeRepo as jest.Mock).mockResolvedValue(undefined);
    (getProductById as jest.Mock).mockResolvedValue(baseProduct);
    (updateProductInRepo as jest.Mock).mockImplementation((_s, p) => Promise.resolve(p));
    (duplicateProductInRepo as jest.Mock).mockResolvedValue({ ...baseProduct, id: 'copy' });
    (deleteProductFromRepo as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createDraftRecord', () => {
    it('creates draft and writes to repo', async () => {
      const draft = await createDraftRecord(shop);
      expect(ensureAuthorized).toHaveBeenCalled();
      expect(writeRepo).toHaveBeenCalledWith(shop, expect.arrayContaining([draft]));
      expect(draft.status).toBe('draft');
    });

    it('throws on repo write failure', async () => {
      (writeRepo as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(createDraftRecord(shop)).rejects.toThrow('fail');
    });

    it('throws when unauthorized', async () => {
      (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('unauthorized'));
      await expect(createDraftRecord(shop)).rejects.toThrow('unauthorized');
    });
  });

  describe('createDraft', () => {
    it('redirects to edit page', async () => {
      await createDraft(shop);
      const draft = (writeRepo as jest.Mock).mock.calls[0][1][0];
      expect(redirect).toHaveBeenCalledWith(
        `/cms/shop/${shop}/products/${draft.id}/edit`
      );
    });

    it('throws when unauthorized', async () => {
      (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('unauthorized'));
      await expect(createDraft(shop)).rejects.toThrow('unauthorized');
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('returns validation errors', async () => {
      const fd = new FormData();
      fd.append('id', 'p1');
      fd.append('price', '10');
      fd.append('title_en', '');
      fd.append('desc_en', 'desc');
      fd.append('media', '[]');
      const result = await updateProduct(shop, fd);
      expect(result.errors).toBeDefined();
      expect(getProductById).not.toHaveBeenCalled();
      expect(captureException).toHaveBeenCalled();
    });

    it('throws when product missing', async () => {
      (getProductById as jest.Mock).mockResolvedValue(undefined);
      const fd = new FormData();
      fd.append('id', 'p1');
      fd.append('price', '10');
      fd.append('title_en', 't');
      fd.append('desc_en', 'd');
      fd.append('media', '[]');
      await expect(updateProduct(shop, fd)).rejects.toThrow(
        'Product p1 not found in shop1'
      );
    });

    it('updates product successfully', async () => {
      const fd = new FormData();
      fd.append('id', 'p1');
      fd.append('price', '10');
      fd.append('title_en', 'new');
      fd.append('desc_en', 'new');
      fd.append('media', '[]');
      const result = await updateProduct(shop, fd);
      expect(updateProductInRepo).toHaveBeenCalled();
      expect(result.product?.title.en).toBe('new');
    });

    it('falls back to empty media array on invalid JSON', async () => {
      const fd = new FormData();
      fd.append('id', 'p1');
      fd.append('price', '10');
      fd.append('title_en', 'new');
      fd.append('desc_en', 'new');
      fd.append('media', 'not json');
      const result = await updateProduct(shop, fd);
      const saved = (updateProductInRepo as jest.Mock).mock.calls[0][1];
      expect(saved.media).toEqual([]);
      expect(result.product?.media).toEqual([]);
    });

    it('filters out media entries missing url or type', async () => {
      const fd = new FormData();
      fd.append('id', 'p1');
      fd.append('price', '10');
      fd.append('title_en', 'new');
      fd.append('desc_en', 'new');
      const media = [
        { url: 'good', type: 'image' },
        { url: '', type: 'image' },
        { url: 'bad' },
      ];
      fd.append('media', JSON.stringify(media));
      const spied = jest
        .spyOn(productSchema, 'safeParse')
        .mockReturnValueOnce({
          success: true,
          data: {
            id: 'p1',
            price: 10,
            title: { en: 'new' },
            description: { en: 'new' },
            media,
          },
        } as any);

      const result = await updateProduct(shop, fd);
      const saved = (updateProductInRepo as jest.Mock).mock.calls[0][1];
      expect(saved.media).toEqual([{ url: 'good', type: 'image' }]);
      expect(result.product?.media).toEqual([{ url: 'good', type: 'image' }]);
      spied.mockRestore();
    });

    it('throws when unauthorized', async () => {
      (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('unauthorized'));
      await expect(updateProduct(shop, new FormData())).rejects.toThrow('unauthorized');
      expect(getProductById).not.toHaveBeenCalled();
    });
  });

  describe('duplicateProduct', () => {
    it('duplicates and redirects', async () => {
      await duplicateProduct(shop, 'p1');
      expect(duplicateProductInRepo).toHaveBeenCalledWith(shop, 'p1');
      expect(redirect).toHaveBeenCalledWith(
        `/cms/shop/${shop}/products/copy/edit`
      );
    });

    it('throws when unauthorized', async () => {
      (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('unauthorized'));
      await expect(duplicateProduct(shop, 'p1')).rejects.toThrow('unauthorized');
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('deletes and redirects', async () => {
      await deleteProduct(shop, 'p1');
      expect(deleteProductFromRepo).toHaveBeenCalledWith(shop, 'p1');
      expect(redirect).toHaveBeenCalledWith(`/cms/shop/${shop}/products`);
    });

    it('throws when unauthorized', async () => {
      (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('unauthorized'));
      await expect(deleteProduct(shop, 'p1')).rejects.toThrow('unauthorized');
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('promoteProduct', () => {
    const statusMap: Record<string, string> = {
      draft: 'review',
      review: 'active',
      scheduled: 'active',
      active: 'active',
      archived: 'archived',
    };

    (['draft', 'review', 'scheduled'] as const).forEach((status) => {
      it(`promotes ${status} product`, async () => {
        const product = { ...baseProduct, status };
        (getProductById as jest.Mock).mockResolvedValue(product);
        (updateProductInRepo as jest.Mock).mockImplementation((_s, p) => Promise.resolve(p));
        const result = await promoteProduct(shop, 'p1');
        expect(updateProductInRepo).toHaveBeenCalled();
        expect(result.status).toBe(statusMap[status]);
      });
    });

    (['active', 'archived'] as const).forEach((status) => {
      it(`returns unchanged for ${status} product`, async () => {
        const product = { ...baseProduct, status };
        (getProductById as jest.Mock).mockResolvedValue(product);
        const result = await promoteProduct(shop, 'p1');
        expect(updateProductInRepo).not.toHaveBeenCalled();
        expect(result).toBe(product);
      });
    });

    it('throws when product missing', async () => {
      (getProductById as jest.Mock).mockResolvedValue(undefined);
      await expect(promoteProduct(shop, 'p2')).rejects.toThrow(
        'Product p2 not found in shop1'
      );
    });

    it('throws when unauthorized', async () => {
      (ensureAuthorized as jest.Mock).mockRejectedValue(new Error('unauthorized'));
      await expect(promoteProduct(shop, 'p1')).rejects.toThrow('unauthorized');
    });
  });
});

