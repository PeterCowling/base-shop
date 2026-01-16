jest.mock('@sanity/client', () => ({
  createClient: jest.fn(),
}));
jest.mock('@acme/platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));
jest.mock('@acme/platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import { publishQueuedPost } from '../src';
import { createClient } from '@sanity/client';
import { getShopById } from '@acme/platform-core/repositories/shop.server';
import { getSanityConfig } from '@acme/platform-core/shops';

describe('publishQueuedPost integration', () => {
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

  it('publishes posts sequentially', async () => {
    fetchMock
      .mockResolvedValueOnce({ _id: 'p1' })
      .mockResolvedValueOnce({ _id: 'p2' });

    const commitMock1 = jest.fn();
    const commitMock2 = jest.fn();
    const setMock1 = jest.fn().mockReturnValue({ commit: commitMock1 });
    const setMock2 = jest.fn().mockReturnValue({ commit: commitMock2 });
    const patchMock = jest
      .fn()
      .mockImplementationOnce(() => ({ set: setMock1 }))
      .mockImplementationOnce(() => ({ set: setMock2 }));

    createClientMock.mockReturnValue({ fetch: fetchMock, patch: patchMock });

    await publishQueuedPost('shop1');
    await publishQueuedPost('shop1');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(patchMock).toHaveBeenNthCalledWith(1, 'p1');
    expect(setMock1).toHaveBeenCalledWith(
      expect.objectContaining({ published: true, publishedAt: expect.any(String) }),
    );
    expect(commitMock1).toHaveBeenCalledTimes(1);

    expect(patchMock).toHaveBeenNthCalledWith(2, 'p2');
    expect(setMock2).toHaveBeenCalledWith(
      expect.objectContaining({ published: true, publishedAt: expect.any(String) }),
    );
    expect(commitMock2).toHaveBeenCalledTimes(1);
  });
});

