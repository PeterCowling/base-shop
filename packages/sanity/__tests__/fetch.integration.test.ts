jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@acme/platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));

jest.mock('@acme/platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import {
  fetchPublishedPosts,
  fetchPostBySlug,
  type BlogPost,
} from '../src';
import { createClient } from '@sanity/client';
import { getShopById } from '@acme/platform-core/repositories/shop.server';
import { getSanityConfig } from '@acme/platform-core/shops';

describe('fetch helpers integration', () => {
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

  it('fetchPublishedPosts returns full posts with product references', async () => {
    const posts: BlogPost[] = [
      {
        title: 'Post',
        slug: 'post',
        excerpt: 'ex',
        mainImage: 'img',
        author: 'auth',
        categories: ['news'],
        products: ['prod-a'],
      },
    ];
    fetchMock.mockResolvedValue(posts);
    await expect(fetchPublishedPosts('shop1')).resolves.toEqual(posts);
  });

  it('fetchPostBySlug returns full post with product blocks', async () => {
    const post: BlogPost = {
      title: 'Post',
      slug: 'post',
      products: ['prod-a'],
      body: [
        { _type: 'block', children: [] },
        { _type: 'productReference', slug: 'prod-a' },
      ],
    };
    fetchMock.mockResolvedValue(post);
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toEqual(post);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { slug: 'post' });
  });

  it('fetchPublishedPosts returns empty array on fetch failure', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await expect(fetchPublishedPosts('shop1')).resolves.toEqual([]);
  });

  it('fetchPostBySlug returns null on fetch failure', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toBeNull();
  });
});

