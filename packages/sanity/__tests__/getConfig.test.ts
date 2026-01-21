import { ZodError } from 'zod';

import { getShopById } from '@acme/platform-core/repositories/shop.server';
import { getSanityConfig } from '@acme/platform-core/shops';

import { getConfig } from '../src';

jest.mock('@acme/platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));
jest.mock('@acme/platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

describe('getConfig', () => {
  const getShopByIdMock = getShopById as jest.Mock;
  const getSanityConfigMock = getSanityConfig as jest.Mock;

  beforeEach(() => {
    getShopByIdMock.mockResolvedValue({ id: 'shop1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rethrows errors from getShopById', async () => {
    const err = new Error('boom');
    getShopByIdMock.mockRejectedValue(err);

    await expect(getConfig('shop1')).rejects.toBe(err);
    expect(getSanityConfigMock).not.toHaveBeenCalled();
  });

  it('throws when shop is missing Sanity credentials', async () => {
    getShopByIdMock.mockResolvedValue(undefined);
    getSanityConfigMock.mockReturnValue(undefined);

    await expect(getConfig('shop1'))
      .rejects.toThrow('Missing Sanity credentials for shop shop1');
  });

  it('throws a ZodError when token is missing', async () => {
    getSanityConfigMock.mockReturnValue({
      projectId: 'pid',
      dataset: 'ds',
    });

    await expect(getConfig('shop1')).rejects.toBeInstanceOf(ZodError);
  });

  it('throws a ZodError when unexpected fields are present', async () => {
    getSanityConfigMock.mockReturnValue({
      projectId: 'pid',
      dataset: 'ds',
      token: 'tkn',
      extra: 'nope',
    });

    await expect(getConfig('shop1')).rejects.toBeInstanceOf(ZodError);
  });
});

