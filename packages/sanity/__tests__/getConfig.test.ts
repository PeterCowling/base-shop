jest.mock('@platform-core/repositories/shop.server', () => ({
  getShopById: jest.fn(),
}));
jest.mock('@platform-core/shops', () => ({
  getSanityConfig: jest.fn(),
}));

import { getConfig } from '../src';
import { getShopById } from '@platform-core/repositories/shop.server';
import { getSanityConfig } from '@platform-core/shops';
import { ZodError } from 'zod';

describe('getConfig', () => {
  const getShopByIdMock = getShopById as jest.Mock;
  const getSanityConfigMock = getSanityConfig as jest.Mock;

  beforeEach(() => {
    getShopByIdMock.mockResolvedValue({ id: 'shop1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
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

