import { jest } from '@jest/globals';
import { __setMockSession, __resetMockSession } from 'next-auth';

const deployShopHosting = jest.fn();
const getDeployStatus = jest.fn();
const updateDeployStatus = jest.fn();

jest.mock('@cms/actions/deployShop.server', () => ({
  __esModule: true,
  deployShopHosting: (...args: any[]) => deployShopHosting(...args),
  getDeployStatus: (...args: any[]) => getDeployStatus(...args),
  updateDeployStatus: (...args: any[]) => updateDeployStatus(...args),
}));

jest.mock('@cms/auth/options', () => ({ authOptions: {} }));

// Use centralized next-auth mapping

let POST: typeof import('../route').POST;
let GET: typeof import('../route').GET;
let PUT: typeof import('../route').PUT;

beforeAll(async () => {
  ({ POST, GET, PUT } = await import('../route'));
});

afterEach(() => {
  jest.resetAllMocks();
});

function req(method: string, body?: any, url = 'http://localhost/api') {
  return new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('authorization', () => {
  it.each([
    ['POST', () => POST(req('POST', { id: '1' }))],
    ['GET', () => GET(req('GET', undefined, 'http://localhost/api?id=1'))],
    ['PUT', () => PUT(req('PUT', { id: '1' }))],
  ])('%s returns 403 for non-admin', async (_, call) => {
    __setMockSession({ user: { role: 'user' } } as any);
    const res = await call();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
  });
});

describe('POST /api/configurator/deploy-shop', () => {
  it('deploys shop when payload valid', async () => {
    __resetMockSession();
    deployShopHosting.mockResolvedValue({ ok: true });

    const res = await POST(req('POST', { id: 'shop1', domain: 'foo' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deployShopHosting).toHaveBeenCalledWith('shop1', 'foo');
  });

  it('returns 400 for invalid json', async () => {
    __resetMockSession();
    const badReq = new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });

    const res = await POST(badReq);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/configurator/deploy-shop', () => {
  it('returns status when id present', async () => {
    __resetMockSession();
    getDeployStatus.mockResolvedValue({ status: 'ok' });

    const res = await GET(req('GET', undefined, 'http://localhost/api?id=shop1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
    expect(getDeployStatus).toHaveBeenCalledWith('shop1');
  });

  it('returns 400 when id missing', async () => {
    __resetMockSession();

    const res = await GET(req('GET'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing id' });
  });
});

describe('PUT /api/configurator/deploy-shop', () => {
  it('updates status with valid payload', async () => {
    __resetMockSession();
    updateDeployStatus.mockResolvedValue(undefined);

    const res = await PUT(req('PUT', { id: 'shop1', domain: 'foo' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updateDeployStatus).toHaveBeenCalledWith('shop1', { domain: 'foo' });
  });

  it('returns 400 when id missing', async () => {
    __resetMockSession();

    const res = await PUT(req('PUT', { domain: 'foo' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing id' });
    expect(updateDeployStatus).not.toHaveBeenCalled();
  });
});
