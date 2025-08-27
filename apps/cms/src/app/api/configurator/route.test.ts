import { jest } from '@jest/globals';

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

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('configurator route', () => {
  it('returns envError while still succeeding when env validation fails', async () => {
    createNewShop.mockResolvedValue({ ok: true });
    validateShopEnv.mockImplementation(() => {
      throw new Error('env failed');
    });

    const { POST } = await import('./route');

    const req = { json: async () => ({ id: 'shop1' }) } as unknown as Request;
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.envError).toBe('env failed');
    expect(body).toHaveProperty('deployment');
  });
});

