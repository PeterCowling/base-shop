import { promises as fs } from 'node:fs';

jest.mock('@acme/platform-core/dataRoot', () => ({
  resolveDataRoot: jest.fn(() => '/data/root'),
}));

jest.mock('node:fs', () => ({
  promises: {
    stat: jest.fn(),
  },
}));

import { checkShopExists } from '../src/checkShopExists.server';

describe('checkShopExists', () => {
  const statMock = fs.stat as jest.Mock;

  afterEach(() => {
    statMock.mockReset();
  });

  it('returns true when directory exists', async () => {
    statMock.mockResolvedValue({ isDirectory: () => true });
    await expect(checkShopExists('shop')).resolves.toBe(true);
  });

  it('returns false when directory does not exist', async () => {
    statMock.mockRejectedValue(new Error('ENOENT'));
    await expect(checkShopExists('shop')).resolves.toBe(false);
  });
});
