jest.mock('fs', () => require('memfs').fs);
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('@acme/lib', () => ({ validateShopName: jest.fn((s: string) => s) }));

import path from 'path';
import { vol } from 'memfs';
import jwt from 'jsonwebtoken';
import * as route from '../[shopId]';
import { validateShopName } from '@acme/lib';

const { onRequest } = route;

describe('onRequest route', () => {
  const verify = jwt.verify as jest.Mock;
  const validate = validateShopName as jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    vol.reset();
    verify.mockReset();
    validate.mockReset().mockImplementation((s: string) => s);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('calls validateShopName with provided shop id', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer good' },
      }),
    });
    expect(validate).toHaveBeenCalledWith('abc');
    expect(res.status).toBe(200);
  });

  it.each(['bad id', 'bad!', 'a'.repeat(64)])(
    'returns 400 for invalid shop id "%s"',
    async (bad) => {
      validate.mockImplementation(() => {
        throw new Error('Invalid');
      });
      const res = await onRequest({
        params: { shopId: bad },
        request: new Request('http://localhost'),
      });
      expect(validate).toHaveBeenCalledWith(bad);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'Invalid shop id' });
      expect(warnSpy).toHaveBeenCalledWith('invalid shop id', { id: bad });
    },
  );

  it('returns 400 when shop id is missing', async () => {
    validate.mockImplementation(() => {
      throw new Error('Invalid');
    });
    const res = await onRequest({
      params: {} as any,
      request: new Request('http://localhost'),
    });
    expect(validate).toHaveBeenCalledWith(undefined);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid shop id' });
    expect(warnSpy).toHaveBeenCalledWith('invalid shop id', { id: undefined });
  });

  it('returns 403 when authorization header missing', async () => {
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost'),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith('missing bearer token', { shopId: 'abc' });
  });

  it('returns 403 when authorization not bearer', async () => {
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Token token' },
      }),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith('missing bearer token', { shopId: 'abc' });
  });

  it('returns 403 when jwt.verify throws', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('bad');
    });
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer token' },
      }),
    });
    expect(verify).toHaveBeenCalledWith(
      'token',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:abc:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith('invalid token', { shopId: 'abc' });
  });

  it('returns 403 when token has wrong audience', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('aud');
    });
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer wrong-aud' },
      }),
    });
    expect(verify).toHaveBeenCalledWith(
      'wrong-aud',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:abc:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith('invalid token', { shopId: 'abc' });
  });

  it('returns 403 when token has wrong issuer', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('iss');
    });
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer wrong-iss' },
      }),
    });
    expect(verify).toHaveBeenCalledWith(
      'wrong-iss',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:abc:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith('invalid token', { shopId: 'abc' });
  });

  it('returns 403 when token payload lacks numeric exp', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: 'soon' });
    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer good' },
      }),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith('invalid token', { shopId: 'abc' });
  });

  it('returns components without config diff when diff not requested', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
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
    });

    const res = await onRequest({
      params: { shopId: 'abc' },
      request: new Request('http://localhost', {
        headers: { authorization: 'Bearer good' },
      }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Fixed bug',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns components and config diff when diff requested', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
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
      request: new Request('http://localhost?diff=1', {
        headers: { authorization: 'Bearer good' },
      }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      components: [
        {
          name: '@acme/button',
          from: '1.0.0',
          to: '1.1.0',
          summary: 'Fixed bug',
          changelog: 'packages/button/CHANGELOG.md',
        },
      ],
      configDiff: { templates: ['main.html'], translations: ['en.json'] },
    });
  });
});
