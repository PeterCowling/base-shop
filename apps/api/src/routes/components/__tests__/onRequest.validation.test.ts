import { createRequest, onRequest, setup, validate } from './onRequestTestUtils';

describe('onRequest validation errors', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = setup();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each(['bad id', 'bad!', 'a'.repeat(64)])(
    'returns 400 for invalid shop id "%s"',
    async (bad) => {
      validate.mockImplementation(() => {
        throw new Error('Invalid');
      });
      const res = await onRequest(createRequest({ shopId: bad }));
      expect(validate).toHaveBeenCalledWith(bad);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'Invalid shop id' });
      expect(warnSpy).toHaveBeenCalledWith(
        'invalid shop id',
        expect.objectContaining({ id: bad })
      );
    },
  );

  it('returns 400 when shop id is missing', async () => {
    validate.mockImplementation(() => {
      throw new Error('Invalid');
    });
    const res = await onRequest(createRequest());
    expect(validate).toHaveBeenCalledWith(undefined);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid shop id' });
    expect(warnSpy).toHaveBeenCalledWith(
      'invalid shop id',
      expect.objectContaining({ id: undefined })
    );
  });
});
