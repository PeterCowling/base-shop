/* eslint-env jest */

import { createPost } from '../../../src/services/blog/posts/create';

jest.mock('../../../src/actions/common/auth', () => ({
  ensureAuthorized: jest.fn(),
}));

const mockCollectProductSlugs = jest.fn();
const mockFilterExistingProductSlugs = jest.fn();

jest.mock('../../../src/services/blog/config', () => ({
  getConfig: jest.fn().mockResolvedValue({}),
  collectProductSlugs: (...args: unknown[]) => mockCollectProductSlugs(...args),
  filterExistingProductSlugs: (...args: unknown[]) =>
    mockFilterExistingProductSlugs(...args),
}));

const repoCreatePost = jest.fn();
const repoSlugExists = jest.fn();

jest.mock('@acme/platform-core/repositories/blog.server', () => ({
  createPost: (...args: unknown[]) => repoCreatePost(...args),
  slugExists: (...args: unknown[]) => repoSlugExists(...args),
}));

describe('createPost', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('merges manual slugs with content slugs', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockCollectProductSlugs.mockReturnValue(['a']);
    mockFilterExistingProductSlugs.mockResolvedValue(['a', 'b']);
    repoCreatePost.mockResolvedValue('id');

    const fd = new FormData();
    fd.set('title', 't');
    fd.set('content', '[]');
    fd.set('products', 'b');

    await createPost('shop', fd);

    expect(mockFilterExistingProductSlugs).toHaveBeenCalledWith('shop', [
      'a',
      'b',
    ]);
    expect(repoCreatePost).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ products: ['a', 'b'] }),
    );
  });

  it('handles invalid JSON content', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockFilterExistingProductSlugs.mockResolvedValue([]);
    repoCreatePost.mockResolvedValue('1');

    const fd = new FormData();
    fd.set('title', 't');
    fd.set('content', '{invalid');

    const result = await createPost('shop', fd);

    expect(result).toEqual({ message: 'Post created', id: '1' });
    expect(mockCollectProductSlugs).not.toHaveBeenCalled();
    expect(repoCreatePost).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ body: [], products: [] }),
    );
  });

  it('forwards categories and publishedAt', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockCollectProductSlugs.mockReturnValue([]);
    mockFilterExistingProductSlugs.mockResolvedValue([]);
    repoCreatePost.mockResolvedValue('2');

    const fd = new FormData();
    fd.set('title', 'T');
    fd.set('content', '[]');
    fd.set('categories', 'c1, c2');
    fd.set('publishedAt', '2024-01-01');

    const result = await createPost('shop', fd);

    expect(result).toEqual({ message: 'Post created', id: '2' });
    expect(repoCreatePost).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        categories: ['c1', 'c2'],
        publishedAt: new Date('2024-01-01').toISOString(),
      }),
    );
  });

  it('returns an error if the slug already exists', async () => {
    repoSlugExists.mockResolvedValue(true);
    mockFilterExistingProductSlugs.mockResolvedValue([]);

    const fd = new FormData();
    fd.set('slug', 'existing');

    const result = await createPost('shop', fd);

    expect(result).toEqual({ error: 'Slug already exists' });
    expect(repoCreatePost).not.toHaveBeenCalled();
  });

  it('logs and returns an error when creation fails', async () => {
    repoSlugExists.mockResolvedValue(false);
    mockFilterExistingProductSlugs.mockResolvedValue([]);
    repoCreatePost.mockRejectedValue(new Error('fail'));
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fd = new FormData();
    fd.set('title', 't');
    fd.set('content', '[]');

    const result = await createPost('shop', fd);

    expect(result).toEqual({ error: 'Failed to create post' });
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to create post',
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});

