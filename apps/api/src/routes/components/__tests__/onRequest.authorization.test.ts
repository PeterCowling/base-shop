import { createRequest, onRequest, setup, verify } from './onRequestTestUtils';

describe('onRequest authorization failures', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = setup();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns 403 when authorization header missing', async () => {
    const res = await onRequest(createRequest({ shopId: 'bcd' }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'missing bearer token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when authorization not bearer', async () => {
    const res = await onRequest(
      createRequest({ shopId: 'bcd', headers: { authorization: 'Token token' } }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'missing bearer token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when preview token secret missing', async () => {
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'token' }));
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
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'token' }));
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
    const res = await onRequest(createRequest({ shopId: 'bcd', token: '' }));
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
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'token' }));
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
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'token' }));
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

  it('returns 403 when token has wrong audience', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockImplementation(() => {
      throw new Error('aud');
    });
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'wrong-aud' }));
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
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'wrong-iss' }));
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
    const res = await onRequest(createRequest({ shopId: 'bcd', token: 'good' }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });

  it('returns 403 when token payload missing exp', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    const { sign, verify: realVerify } = jest.requireActual('jsonwebtoken');
    verify.mockImplementation(realVerify);
    const token = sign(
      {},
      'secret',
      {
        algorithm: 'HS256',
        audience: 'upgrade-preview',
        issuer: 'acme',
        subject: 'shop:bcd:upgrade-preview',
      },
    );
    const res = await onRequest(createRequest({ shopId: 'bcd', token }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid token',
      expect.objectContaining({ shopId: 'bcd' })
    );
  });
});
