jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));

jest.mock('@platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import { fetchPublishedPosts, fetchPostBySlug } from '../src';
import { createClient } from '@sanity/client';
import { getShopById } from '@platform-core/repositories/shop.server';
import { getSanityConfig } from '@platform-core/shops';

describe('fetch helpers', () => {
  const createClientMock = createClient as jest.Mock;
  const getShopByIdMock = getShopById as jest.Mock;
  const getSanityConfigMock = getSanityConfig as jest.Mock;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    createClientMock.mockReturnValue({ fetch: fetchMock });
    getShopByIdMock.mockResolvedValue({ id: 'shop1' });
    getSanityConfigMock.mockReturnValue({
      projectId: 'pid',
      dataset: 'ds',
      token: 'tkn',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetchPublishedPosts returns posts on success', async () => {
    const posts = [{ title: 'Post', slug: 'post' }];
    fetchMock.mockResolvedValue(posts);
    await expect(fetchPublishedPosts('shop1')).resolves.toEqual(posts);
  });

  it('fetchPublishedPosts returns empty array on failure', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await expect(fetchPublishedPosts('shop1')).resolves.toEqual([]);
  });

  it('fetchPostBySlug returns post on success', async () => {
    const post = { title: 'Post', slug: 'post' };
    fetchMock.mockResolvedValue(post);
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toEqual(post);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { slug: 'post' });
  });

  it('fetchPostBySlug returns null when not found', async () => {
    fetchMock.mockResolvedValue(null);
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toBeNull();
  });

  it('fetchPostBySlug returns null on failure', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toBeNull();
  });
});

