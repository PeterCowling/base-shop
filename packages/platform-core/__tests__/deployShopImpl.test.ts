import { jest } from '@jest/globals';
import { createFsFromVolume,Volume } from 'memfs';
import path from 'path';

const vol = new Volume();
const fs = createFsFromVolume(vol);

jest.mock('fs', () => fs);

const genSecret = jest.fn(() => 'secret-123');
jest.mock('@acme/lib/security', () => ({ genSecret }));

describe('deployShopImpl', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });

  it('scaffolds, injects SESSION_SECRET, deploys, and writes deploy info', async () => {
    vol.fromJSON({
      '/workspace/base-shop/apps/shop/.env': ''
    }, '/');
    const adapter = {
      scaffold: jest.fn(),
      deploy: jest.fn(() => ({ status: 'success' as const })),
      writeDeployInfo: jest.fn(),
    };
    const { deployShop } = await import('../src/createShop/deploy');
    const result = deployShop('shop', undefined, adapter as any);
    expect(adapter.scaffold).toHaveBeenCalledWith(path.join('apps', 'shop'));
    const envPath = '/workspace/base-shop/apps/shop/.env';
    const env = fs.readFileSync(envPath, 'utf8');
    expect(env).toMatch(/SESSION_SECRET=secret-123/);
    expect(adapter.deploy).toHaveBeenCalledWith('shop', undefined);
    expect(adapter.writeDeployInfo).toHaveBeenCalledWith('shop', result);
    expect(result).toEqual({ status: 'success' });
  });

  it('handles errors and still writes deploy info', async () => {
    const adapter = {
      scaffold: jest.fn(() => { throw new Error('boom'); }),
      deploy: jest.fn(() => ({ status: 'success' as const })),
      writeDeployInfo: jest.fn(),
    };
    const { deployShop } = await import('../src/createShop/deploy');
    const result = deployShop('boomshop', undefined, adapter as any);
    expect(result.status).toBe('error');
    expect(result.error).toBe('boom');
    expect(adapter.deploy).toHaveBeenCalledWith('boomshop', undefined);
    expect(adapter.writeDeployInfo).toHaveBeenCalledWith('boomshop', result);
  });
});

afterAll(() => {
  jest.resetModules();
});
