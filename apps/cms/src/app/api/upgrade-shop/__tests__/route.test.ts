import { jest } from '@jest/globals';

const requirePermission = jest.fn<any, any[]>();
const spawnSync = jest.fn<any, any[]>();

jest.mock('@acme/auth', () => ({
  requirePermission: (...args: any[]) => requirePermission(...args),
}));

jest.mock('child_process', () => ({
  spawnSync: (...args: any[]) => spawnSync(...args),
}));

let POST: typeof import('../route').POST;
let consoleErrorSpy: jest.SpyInstance<any, any, any>;

beforeAll(async () => {
  ({ POST } = await import('../route'));
});

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((() => {}) as any) as unknown as jest.SpyInstance<any, any, any>;
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  jest.resetAllMocks();
});

function req(body: any) {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/upgrade-shop', () => {
  it('returns 401 when permission denied', async () => {
    requirePermission.mockRejectedValue(new Error('nope'));
    const res = await POST(req({ shop: 'shop1' }) as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when shop missing', async () => {
    requirePermission.mockResolvedValue(undefined);
    const res = await POST(req({}) as any);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'shop required' });
  });

  it('returns 500 when script fails', async () => {
    requirePermission.mockResolvedValue(undefined);
    spawnSync.mockReturnValue({ status: 1 });
    const chdir = jest.spyOn(process, 'chdir').mockImplementation(() => {});

    const res = await POST(req({ shop: 'shop1' }) as any);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Upgrade failed' });
    expect(spawnSync).toHaveBeenCalled();

    chdir.mockRestore();
  });
});
