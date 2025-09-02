jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));
jest.mock('@platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));
jest.mock('@platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import {
  fetchPublishedPosts,
  fetchPostBySlug,
  publishQueuedPost,
} from '../src';
import { createClient } from '@sanity/client';
import { getShopById } from '@platform-core/repositories/shop.server';
import { getSanityConfig } from '@platform-core/shops';

describe('sanity index', () => {
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

  it('fetchPublishedPosts returns posts', async () => {
    const posts = [{ title: 'Post', slug: 'post' }];
    fetchMock.mockResolvedValue(posts);
    await expect(fetchPublishedPosts('shop1')).resolves.toEqual(posts);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetchPostBySlug returns matching post', async () => {
    const post = { title: 'Post', slug: 'post' };
    fetchMock.mockResolvedValue(post);
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toEqual(post);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { slug: 'post' });
  });

  it('publishQueuedPost publishes next post', async () => {
    const commitMock = jest.fn();
    const setMock = jest.fn().mockReturnValue({ commit: commitMock });
    const patchMock = jest.fn().mockReturnValue({ set: setMock });
    fetchMock.mockResolvedValue({ _id: 'p1' });
    createClientMock.mockReturnValue({ fetch: fetchMock, patch: patchMock });

    await publishQueuedPost('shop1');

    expect(fetchMock).toHaveBeenCalled();
    expect(patchMock).toHaveBeenCalledWith('p1');
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ published: true, publishedAt: expect.any(String) })
    );
    expect(commitMock).toHaveBeenCalled();
  });

  it('publishQueuedPost does nothing when no queued post', async () => {
    const patchMock = jest.fn();
    fetchMock.mockResolvedValue(null);
    createClientMock.mockReturnValue({ fetch: fetchMock, patch: patchMock });

    await publishQueuedPost('shop1');

    expect(fetchMock).toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });
});

