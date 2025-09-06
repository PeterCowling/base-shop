import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('checkShopExists', () => {
  it('returns true when directory exists', async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'check-shop-'));
    await fs.mkdir(path.join(dataRoot, 'existing-shop'));

    jest.resetModules();
    jest.doMock('@acme/platform-core/dataRoot', () => ({ resolveDataRoot: () => dataRoot }));
    const { checkShopExists } = await import('../src/checkShopExists.server');

    await expect(checkShopExists('existing-shop')).resolves.toBe(true);

    await fs.rm(dataRoot, { recursive: true, force: true });
  });

  it('returns false for non-existent directory', async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'check-shop-'));

    jest.resetModules();
    jest.doMock('@acme/platform-core/dataRoot', () => ({ resolveDataRoot: () => dataRoot }));
    const { checkShopExists } = await import('../src/checkShopExists.server');

    await expect(checkShopExists('missing-shop')).resolves.toBe(false);

    await fs.rm(dataRoot, { recursive: true, force: true });
  });
});
