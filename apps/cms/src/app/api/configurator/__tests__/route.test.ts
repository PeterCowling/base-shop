import { jest } from '@jest/globals';

// jsdom's Response lacks the static json helper used by NextResponse
if (typeof (Response as any).json !== 'function') {
  (Response as any).json = function json(body: unknown, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new Response(JSON.stringify(body), { ...init, headers });
  };
}

const createNewShop = jest.fn();
const validateShopEnv = jest.fn();

jest.mock('@cms/actions/createShop.server', () => ({
  __esModule: true,
  createNewShop: (...args: any[]) => createNewShop(...args),
}));

jest.mock('@platform-core/configurator', () => ({
  __esModule: true,
  validateShopEnv: (...args: any[]) => validateShopEnv(...args),
}));

let POST: typeof import('../route').POST;

beforeAll(async () => {
  ({ POST } = await import('../route'));
});

let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  jest.resetAllMocks();
});

function req(body: any) {
  return { json: async () => body } as unknown as Request;
}

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

