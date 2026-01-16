jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));
jest.mock('@acme/platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));
jest.mock('@acme/platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import { fetchPublishedPosts } from '../src';
import { createClient } from '@sanity/client';
import { getShopById } from '@acme/platform-core/repositories/shop.server';
import { getSanityConfig } from '@acme/platform-core/shops';

describe('client', () => {
  const createClientMock = createClient as jest.Mock;
  const getShopByIdMock = getShopById as jest.Mock;
  const getSanityConfigMock = getSanityConfig as jest.Mock;

  beforeEach(() => {
    createClientMock.mockReturnValue({ fetch: jest.fn().mockResolvedValue([]) });
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

  it('calls createClient with expected options', async () => {
    await fetchPublishedPosts('shop1');

    expect(createClientMock).toHaveBeenCalledWith({
      projectId: 'pid',
      dataset: 'ds',
      token: 'tkn',
      apiVersion: '2023-01-01',
      useCdn: true,
    });
  });
});
