jest.mock('fs', () => require('memfs').fs);
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));

import path from 'path';
import { vol } from 'memfs';
import jwt from 'jsonwebtoken';
import { onRequest } from '../[shopId]';

describe('onRequest route', () => {
  const verify = jwt.verify as jest.Mock;

  beforeEach(() => {
    vol.reset();
    verify.mockReset();
  });

  it('returns 400 for invalid shop id', async () => {
    const res = await onRequest({
      params: { shopId: 'Invalid!' },
      request: new Request('http://localhost'),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid shop id' });
  });

  it('returns 403 for invalid token', async () => {
    verify.mockImplementation(() => { throw new Error('bad'); });
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer token' },
      }),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns components and config diff for valid request', async () => {
    verify.mockImplementation(() => {});
    const root = path.resolve(__dirname, '../../../../../../..');
    vol.fromJSON({
      [`${root}/data/shops/abc/shop.json`]: JSON.stringify({
        componentVersions: { '@acme/button': '1.0.0' },
      }),
      [`${root}/packages/button/package.json`]: JSON.stringify({
        name: '@acme/button',
        version: '1.1.0',
      }),
      [`${root}/packages/button/CHANGELOG.md`]: '# Changelog\n\nFixed bug\n',
      [`${root}/apps/shop-abc/src/templates/main.html`]: 'app',
      [`${root}/packages/template-app/src/templates/main.html`]: 'template',
      [`${root}/apps/shop-abc/src/translations/en.json`]: '{}',
      [`${root}/packages/template-app/src/translations/en.json`]: '{"foo":"bar"}',
    });

    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost?diff', {
        headers: { authorization: 'Bearer good' },
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.components).toEqual([
      {
        name: '@acme/button',
        from: '1.0.0',
        to: '1.1.0',
        summary: 'Fixed bug',
        changelog: 'packages/button/CHANGELOG.md',
      },
    ]);
    expect(body.configDiff).toEqual({
      templates: ['main.html'],
      translations: ['en.json'],
    });
  });
});

