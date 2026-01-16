/* eslint-env jest */

import { updatePost } from '../../../src/services/blog/posts/update';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

const mockCollectProductSlugs = jest.fn();
const mockFilterExistingProductSlugs = jest.fn();

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
  collectProductSlugs: (...args: unknown[]) => mockCollectProductSlugs(...args),
  filterExistingProductSlugs: (
    ...args: unknown[]
  ) => mockFilterExistingProductSlugs(...args),
}));

const repoUpdatePost = jest.fn();
const repoSlugExists = jest.fn();

jest.mock('@acme/platform-core/repositories/blog.server', () => ({
  updatePost: (...args: unknown[]) => repoUpdatePost(...args),
  slugExists: (...args: unknown[]) => repoSlugExists(...args),
}));

describe('updatePost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns error on slug collision', async () => {
    repoSlugExists.mockResolvedValue(true);
    mockCollectProductSlugs.mockReturnValue([]);
    mockFilterExistingProductSlugs.mockResolvedValue([]);
    const fd = new FormData();
    fd.set('id', '1');
    fd.set('slug', 'exists');

    const result = await updatePost('shop', fd);

    expect(result).toEqual({ error: 'Slug already exists' });
    expect(repoUpdatePost).not.toHaveBeenCalled();
  });

  it('handles JSON parse failure', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockCollectProductSlugs.mockReturnValue(['x']);
    mockFilterExistingProductSlugs.mockResolvedValue([]);

    const fd = new FormData();
    fd.set('id', '1');
    fd.set('title', 't');
    fd.set('content', '{invalid');

    const result = await updatePost('shop', fd);

    expect(result).toEqual({ message: 'Post updated' });
    expect(mockCollectProductSlugs).not.toHaveBeenCalled();
    expect(repoUpdatePost).toHaveBeenCalledWith({}, '1', expect.objectContaining({
      body: [],
      products: [],
    }));
  });

  it('filters product slugs', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockCollectProductSlugs.mockReturnValue(['a', 'b']);
    mockFilterExistingProductSlugs.mockResolvedValue(['b', 'd']);

    const fd = new FormData();
    fd.set('id', '1');
    fd.set('content', '[]');
    fd.set('products', 'c, d');

    await updatePost('shop', fd);

    expect(mockFilterExistingProductSlugs).toHaveBeenCalledWith('shop', ['a', 'b', 'c', 'd']);
    expect(repoUpdatePost).toHaveBeenCalledWith(
      {},
      '1',
      expect.objectContaining({ products: ['b', 'd'] }),
    );
  });

  it('updates post successfully', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockCollectProductSlugs.mockReturnValue([]);
    mockFilterExistingProductSlugs.mockResolvedValue([]);

    const fd = new FormData();
    fd.set('id', '1');
    fd.set('title', 'T');
    fd.set('content', '[]');
    fd.set('slug', 's');
    fd.set('excerpt', 'e');
    fd.set('mainImage', 'm');
    fd.set('author', 'a');
    fd.set('categories', 'c1, c2');
    fd.set('publishedAt', '2024-01-01');

    const result = await updatePost('shop', fd);

    expect(result).toEqual({ message: 'Post updated' });
    expect(repoUpdatePost).toHaveBeenCalledWith({}, '1', {
      title: 'T',
      body: [],
      products: [],
      slug: { current: 's' },
      excerpt: 'e',
      mainImage: 'm',
      author: 'a',
      categories: ['c1', 'c2'],
      publishedAt: new Date('2024-01-01').toISOString(),
    });
  });
});

