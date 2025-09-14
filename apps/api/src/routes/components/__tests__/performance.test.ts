jest.mock('fs', () => require('memfs').fs);
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('@acme/lib', () => ({ validateShopName: jest.fn((s: string) => s) }));

import path from 'path';
import { vol } from 'memfs';
import jwt from 'jsonwebtoken';
import { validateShopName } from '@acme/lib';
import { diffDirectories, onRequest } from '../[shopId]';
import { performance } from 'perf_hooks';

describe('performance benchmarks', () => {
  const verify = jwt.verify as jest.Mock;
  const validate = validateShopName as jest.Mock;
  const root = path.resolve(__dirname, '../../../../../../..');

  beforeEach(() => {
    vol.reset();
    verify.mockReset();
    validate.mockReset().mockImplementation((s: string) => s);
    delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  });

  function setupFixture(count: number) {
    const files: Record<string, string> = {
      [`${root}/data/shops/bcd/shop.json`]: JSON.stringify({ componentVersions: {} }),
    };
    for (let i = 0; i < count; i++) {
      files[`${root}/apps/shop-bcd/src/templates/file${i}.html`] = 'app';
      files[`${root}/packages/template-app/src/templates/file${i}.html`] = 'template';
      files[`${root}/apps/shop-bcd/src/translations/file${i}.json`] = '{}';
      files[`${root}/packages/template-app/src/translations/file${i}.json`] = '{}';
    }
    vol.fromJSON(files);
  }

  it('diffDirectories with thousands of files', async () => {
    setupFixture(2000);
    const dirA = path.join(root, 'apps', 'shop-bcd', 'src', 'templates');
    const dirB = path.join(root, 'packages', 'template-app', 'src', 'templates');
    const startSingle = performance.now();
    diffDirectories(dirA, dirB);
    const single = performance.now() - startSingle;

    const startConcurrent = performance.now();
    await Promise.all(
      Array.from({ length: 10 }).map(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              diffDirectories(dirA, dirB);
              resolve();
            }, 0);
          }),
      ),
    );
    const concurrent = performance.now() - startConcurrent;
    console.log(`diffDirectories: single=${single.toFixed(2)}ms concurrent x10=${concurrent.toFixed(2)}ms`);
  });

  it('onRequest under concurrent load', async () => {
    setupFixture(2000);
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const req = new Request('http://localhost?diff=1', {
      headers: { authorization: 'Bearer good' },
    });
    const start = performance.now();
    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        onRequest({ params: { shopId: 'bcd' }, request: req }),
      ),
    );
    const concurrent = performance.now() - start;
    console.log(`onRequest concurrent x10=${concurrent.toFixed(2)}ms`);
  });
});
