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
  getConfig,
  publishQueuedPost,
} from '../index';
import { createClient } from '@sanity/client';
import { getShopById } from '@acme/platform-core/repositories/shop.server';
import { getSanityConfig } from '@acme/platform-core/shops';

describe('sanity.server', () => {
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
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetchPublishedPosts returns empty array on client error', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await expect(fetchPublishedPosts('shop1')).resolves.toEqual([]);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetchPostBySlug returns post on success', async () => {
    const post = { title: 'Post', slug: 'post' };
    fetchMock.mockResolvedValue(post);
    await expect(fetchPostBySlug('shop1', 'post')).resolves.toEqual(post);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { slug: 'post' });
  });

  it('fetchPostBySlug returns null on client error', async () => {
    fetchMock.mockRejectedValue(new Error('fail'));
    await expect(fetchPostBySlug('shop1', 'slug')).resolves.toBeNull();
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getConfig throws when env vars are missing', async () => {
    getSanityConfigMock.mockReturnValue(undefined);
    await expect(getConfig('shop1')).rejects.toThrow('Missing Sanity credentials for shop shop1');
  });

  it('publishQueuedPost patches first unpublished post', async () => {
    const commitMock = jest.fn();
    const setMock = jest.fn().mockReturnValue({ commit: commitMock });
    const patchMock = jest.fn().mockReturnValue({ set: setMock });
    fetchMock.mockResolvedValue({ _id: 'p1' });
    createClientMock.mockReturnValue({ fetch: fetchMock, patch: patchMock });

    await publishQueuedPost('shop1');

    expect(fetchMock).toHaveBeenCalled();
    expect(patchMock).toHaveBeenCalledWith('p1');
    expect(setMock).toHaveBeenCalled();
    expect(commitMock).toHaveBeenCalled();
  });

  it('publishQueuedPost returns early when no queued post', async () => {
    const patchMock = jest.fn();
    fetchMock.mockResolvedValue({});
    createClientMock.mockReturnValue({ fetch: fetchMock, patch: patchMock });

    await publishQueuedPost('shop1');

    expect(fetchMock).toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
  });
});
