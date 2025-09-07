jest.mock('@platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));

jest.mock('@platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import { getConfig } from '../src';
import { getShopById } from '@platform-core/repositories/shop.server';
import { getSanityConfig } from '@platform-core/shops';

describe('getConfig', () => {
  const getShopByIdMock = getShopById as jest.Mock;
  const getSanityConfigMock = getSanityConfig as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rethrows when getShopById rejects', async () => {
    const err = new Error('fail');
    getShopByIdMock.mockRejectedValue(err);

    await expect(getConfig('shop1')).rejects.toBe(err);
  });

  it('throws when Sanity credentials are missing', async () => {
    getShopByIdMock.mockResolvedValue(undefined);
    getSanityConfigMock.mockReturnValue(undefined);

    await expect(getConfig('shop1')).rejects.toThrow(
      'Missing Sanity credentials for shop shop1',
    );
    expect(getSanityConfigMock).toHaveBeenCalledWith(undefined);
  });
});
