jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));
jest.mock('@acme/platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));
jest.mock('@acme/platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));
jest.mock('@date-utils', () => ({
  nowIso: jest.fn(),
}));

import {
  fetchPublishedPosts,
  fetchPostBySlug,
  publishQueuedPost,
} from '../src';
import { createClient } from '@sanity/client';
import { getShopById } from '@acme/platform-core/repositories/shop.server';
import { getSanityConfig } from '@acme/platform-core/shops';
import { nowIso } from '@acme/date-utils';

describe('sanity index', () => {
  const createClientMock = createClient as jest.Mock;
  const getShopByIdMock = getShopById as jest.Mock;
  const getSanityConfigMock = getSanityConfig as jest.Mock;
  const nowIsoMock = nowIso as jest.Mock;
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
    nowIsoMock.mockReturnValue('2020-01-01T00:00:00Z');
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
      expect.objectContaining({ published: true, publishedAt: '2020-01-01T00:00:00Z' })
    );
    expect(nowIsoMock).toHaveBeenCalled();
    expect(commitMock).toHaveBeenCalled();
  });

  it('publishQueuedPost swallows commit errors', async () => {
    const commitMock = jest.fn().mockRejectedValue(new Error('fail'));
    const setMock = jest.fn().mockReturnValue({ commit: commitMock });
    const patchMock = jest.fn().mockReturnValue({ set: setMock });
    fetchMock.mockResolvedValue({ _id: 'p1' });
    createClientMock.mockReturnValue({ fetch: fetchMock, patch: patchMock });

    await expect(publishQueuedPost('shop1')).resolves.toBeUndefined();
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

