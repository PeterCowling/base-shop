import path from 'node:path';
import { DATA_ROOT } from '@acme/platform-core/dataRoot';

afterAll(() => { jest.resetModules(); jest.clearAllMocks(); });

describe('analyticsMTime', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 0 when analytics file is missing', async () => {
    const { analyticsMTime } = await import('../segments');
    await expect(analyticsMTime('missing-shop')).resolves.toBe(0);
  });

  it('returns file mtime when analytics file exists', async () => {
    const { promises: fs } = await import('node:fs');
    const shop = `test-shop-${Date.now()}`;
    const dir = path.join(DATA_ROOT, shop);
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, 'analytics.jsonl');
    await fs.writeFile(file, '');
    const stat = await fs.stat(file);
    const { analyticsMTime } = await import('../segments');
    await expect(analyticsMTime(shop)).resolves.toBe(stat.mtimeMs);
    await fs.rm(dir, { recursive: true, force: true });
  });
});
