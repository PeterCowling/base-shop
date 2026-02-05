import * as route from '../[shopId]';

import { createContext, createToken,createWarnSpy, setup, verify } from './testHelpers';

const { onRequest } = route;

describe('onRequest authorization', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    setup();
    warnSpy = createWarnSpy();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns 403 when authorization header missing', async () => {
    const res = await onRequest(createContext({ shopId: 'bcd' }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'missing bearer token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when authorization not bearer', async () => {
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Token token' }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'missing bearer token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when preview token secret missing', async () => {
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer token' }),
    );
    expect(verify).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when preview token secret is empty string', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = '';
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer token' }),
    );
    expect(verify).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token is empty', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation((token: string) => {
      if (!token) {
        throw new Error('empty');
      }
      return { exp: Math.floor(Date.now() / 1000) + 60 };
    });
    const res = await onRequest({
      params: { shopId: 'bcd' },
      request: {
        headers: { get: () => 'Bearer ' },
        url: 'http://localhost',
      } as any,
    });
    expect(verify).toHaveBeenCalledWith(
      '',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:bcd:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when jwt.verify throws', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('bad');
    });
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer token' }),
    );
    expect(verify).toHaveBeenCalledWith(
      'token',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:bcd:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token expired', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    const { TokenExpiredError } = jest.requireActual('jsonwebtoken');
    verify.mockImplementation(() => {
      throw new TokenExpiredError('jwt expired', new Date());
    });
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer token' }),
    );
    expect(verify).toHaveBeenCalled();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token has wrong audience', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('aud');
    });
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer wrong-aud' }),
    );
    expect(verify).toHaveBeenCalledWith(
      'wrong-aud',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:bcd:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token has wrong issuer', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('iss');
    });
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer wrong-iss' }),
    );
    expect(verify).toHaveBeenCalledWith(
      'wrong-iss',
      'secret',
      expect.objectContaining({
        algorithms: ['HS256'],
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:bcd:upgrade-preview',
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token payload lacks numeric exp', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: 'soon' });
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: 'Bearer good' }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token payload missing exp', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(jest.requireActual('jsonwebtoken').verify);
    const token = createToken({}, 'secret');
    const res = await onRequest(
      createContext({ shopId: 'bcd', authorization: `Bearer ${token}` }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });
});
