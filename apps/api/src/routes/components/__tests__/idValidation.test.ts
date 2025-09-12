import { verify, validate, setup, createWarnSpy, createContext } from './testHelpers';
import * as route from '../[shopId]';

const { onRequest } = route;

describe('onRequest id validation', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    setup();
    warnSpy = createWarnSpy();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('calls validateShopName with provided shop id', async () => {
    process.env.UPGRADE_PREVIEW_TOKEN_SECRET = 'secret';
    verify.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 });
    const res = await onRequest(
      createContext({ shopId: 'abc', authorization: 'Bearer good' }),
    );
    expect(validate).toHaveBeenCalledWith('abc');
    expect(res.status).toBe(200);
  });

  it.each(['bad id', 'bad!', 'a'.repeat(64)])(
    'returns 400 for invalid shop id "%s"',
    async (bad) => {
      validate.mockImplementation(() => {
        throw new Error('Invalid');
      });
      const res = await onRequest(createContext({ shopId: bad }));
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
    const res = await onRequest(createContext({ shopId: undefined }));
    expect(validate).toHaveBeenCalledWith(undefined);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid shop id' });
    expect(warnSpy).toHaveBeenCalledWith('invalid shop id', { id: undefined });
  });
});
