import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('checkShopExists integration', () => {
  it('resolves false when shop directory is missing', async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'check-shop-'));

    jest.resetModules();
    jest.doMock('@platform-core/dataRoot', () => ({ resolveDataRoot: () => dataRoot }));
    const { checkShopExists } = await import('../src/checkShopExists.server');

    await expect(checkShopExists('valid-shop')).resolves.toBe(false);

    await fs.rm(dataRoot, { recursive: true, force: true });
  });
});
