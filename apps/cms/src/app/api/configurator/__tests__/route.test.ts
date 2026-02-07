import { jest } from '@jest/globals';

import { jsonRequest } from '@acme/test-utils';

const createNewShop = jest.fn<Promise<{ ok: boolean }>, any[]>();
const validateShopEnv = jest.fn<void, any[]>();

jest.mock('@cms/actions/createShop.server', () => ({
  __esModule: true,
  createNewShop: (...args: any[]) => createNewShop(...args),
}));

jest.mock('@acme/platform-core/configurator', () => ({
  __esModule: true,
  validateShopEnv: (...args: any[]) => validateShopEnv(...args),
}));

let POST: typeof import('../route').POST;

beforeAll(async () => {
  ({ POST } = await import('../route'));
});

let consoleError: jest.SpyInstance<any, any, any>;

beforeEach(() => {
  consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation((() => {}) as any) as unknown as jest.SpyInstance<any, any, any>;
});

afterEach(() => {
  consoleError.mockRestore();
  jest.resetAllMocks();
});

const req = (body: any) => jsonRequest(body);

describe('POST /cms/api/configurator', () => {
  it('returns 201 with deployment when env is valid', async () => {
    createNewShop.mockResolvedValue({ ok: true });

    const res = await POST(req({ id: 'shop1' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({ success: true, deployment: { ok: true } });
    expect(validateShopEnv).toHaveBeenCalledWith('shop1');
  });

  it('returns 201 with envError when validateShopEnv throws', async () => {
    createNewShop.mockResolvedValue({ ok: true });
    validateShopEnv.mockImplementation(() => {
      throw new Error('bad env');
    });

    const res = await POST(req({ id: 'shop1' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      deployment: { ok: true },
      envError: 'bad env',
    });
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Required' });
  });

  it('returns 403 when createNewShop throws Forbidden', async () => {
    createNewShop.mockRejectedValue(new Error('Forbidden'));

    const res = await POST(req({ id: 'shop1' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).toEqual({ error: 'Forbidden' });
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to configure shop',
      expect.any(Error),
    );
  });

  it('returns 400 when createNewShop throws other errors', async () => {
    createNewShop.mockRejectedValue(new Error('boom'));

    const res = await POST(req({ id: 'shop1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'boom' });
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to configure shop',
      expect.any(Error),
    );
  });
});
