import { jest } from '@jest/globals';
import { jsonRequest } from '@acme/test-utils';

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

const req = (body: any) => jsonRequest(body);

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
