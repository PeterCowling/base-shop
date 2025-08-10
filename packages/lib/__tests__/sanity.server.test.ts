jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@sanity/client';
import {
  fetchPublishedPosts,
  fetchPostBySlug,
  getConfig,
} from '../src/sanity.server';

describe('sanity.server', () => {
  const OLD_ENV = process.env;
  const mockCreateClient = createClient as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      SANITY_SHOP_PROJECT_ID: 'pid',
      SANITY_SHOP_DATASET: 'dataset',
      SANITY_SHOP_READ_TOKEN: 'token',
    } as NodeJS.ProcessEnv;
    mockCreateClient.mockReset();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('fetchPublishedPosts returns [] on client error', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('fail'));
    mockCreateClient.mockReturnValue({ fetch: fetchMock });

    await expect(fetchPublishedPosts('shop')).resolves.toEqual([]);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetchPostBySlug returns null on client error', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('fail'));
    mockCreateClient.mockReturnValue({ fetch: fetchMock });

    await expect(fetchPostBySlug('shop', 'slug')).resolves.toBeNull();
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getConfig throws when required env vars are absent', () => {
    delete process.env.SANITY_SHOP_PROJECT_ID;
    delete process.env.SANITY_SHOP_DATASET;

    expect(() => getConfig('shop')).toThrow(
      'Missing Sanity credentials for shop shop',
    );
  });
});
