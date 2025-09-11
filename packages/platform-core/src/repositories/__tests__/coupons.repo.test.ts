import { promises as fs } from 'fs';
import * as path from 'path';

const DATA_ROOT = '/data/shops';

jest.mock('../../dataRoot', () => ({ DATA_ROOT }));

describe('jsonCouponsRepository.write', () => {
  it('creates shop directory recursively when absent', async () => {
    const shop = 'demo';
    const mkdirSpy = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined as never);
    const writeSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined as never);
    const renameSpy = jest.spyOn(fs, 'rename').mockResolvedValue(undefined as never);

    const { jsonCouponsRepository } = await import('../coupons.json.server');

    await jsonCouponsRepository.write(shop, []);

    expect(mkdirSpy).toHaveBeenCalledWith(path.join(DATA_ROOT, shop), {
      recursive: true,
    });

    mkdirSpy.mockRestore();
    writeSpy.mockRestore();
    renameSpy.mockRestore();
  });
});
