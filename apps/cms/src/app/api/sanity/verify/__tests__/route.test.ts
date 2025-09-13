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

const verifyCredentials = jest.fn();

jest.mock('@acme/plugin-sanity', () => ({
  __esModule: true,
  verifyCredentials: (...args: any[]) => verifyCredentials(...args),
}));

let POST: typeof import('../route').POST;

beforeAll(async () => {
  ({ POST } = await import('../route'));
});

describe('POST /api/sanity/verify', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('returns datasets on success', async () => {
    verifyCredentials.mockResolvedValue(true);
    const mockFetch = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ datasets: [{ name: 'prod' }] }), { status: 200 })
      );
    (global as any).fetch = mockFetch;

    const res = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'p123', token: 'tok', dataset: 'prod' }),
      })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, datasets: ['prod'] });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://p123.api.sanity.io/v2023-01-01/datasets',
      { headers: { Authorization: 'Bearer tok' } }
    );
    expect(verifyCredentials).toHaveBeenCalledWith({ projectId: 'p123', dataset: 'prod', token: 'tok' });
  });

  it('returns 401 for invalid credentials', async () => {
    verifyCredentials.mockResolvedValue(false);
    const mockFetch = jest
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ datasets: [] }), { status: 200 }));
    (global as any).fetch = mockFetch;

    const res = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'p123', token: 'tok', dataset: 'prod' }),
      })
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Invalid Sanity credentials',
      errorCode: 'INVALID_CREDENTIALS',
      datasets: [],
    });
  });

  it('returns 500 when dataset list fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockFetch = jest
      .fn()
      .mockResolvedValue(new Response('fail', { status: 500 }));
    (global as any).fetch = mockFetch;

    const res = await POST(
      new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'p123', token: 'tok' }),
      })
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Failed to list datasets',
      errorCode: 'DATASET_LIST_ERROR',
    });
    expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
  });
});

