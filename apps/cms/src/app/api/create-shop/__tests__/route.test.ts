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

jest.mock('@cms/actions/createShop.server', () => ({
  __esModule: true,
  createNewShop: (...args: any[]) => createNewShop(...args),
}));

let POST: typeof import('../route').POST;

beforeAll(async () => {
  ({ POST } = await import('../route'));
});

afterEach(() => {
  jest.resetAllMocks();
});

function req(body: any) {
  return { json: async () => body } as unknown as Request;
}

describe('POST /cms/api/create-shop', () => {
  it('returns 400 for invalid payload', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Required' });
  });

  it('returns 201 with deployment on success', async () => {
    createNewShop.mockResolvedValue({ ok: true });
    const res = await POST(req({ id: 'shop1' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({ success: true, deployment: { ok: true } });
    expect(createNewShop).toHaveBeenCalledWith('shop1', expect.any(Object));
  });
});
