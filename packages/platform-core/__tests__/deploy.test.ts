import { jest } from '@jest/globals';
import { Volume, createFsFromVolume } from 'memfs';
import path from 'path';

const vol = new Volume();
const fs = createFsFromVolume(vol);

jest.mock('fs', () => fs);

const genSecret = jest.fn(() => 'secret-123');
jest.mock('@acme/shared-utils', () => ({ genSecret }));

const originalFetch = global.fetch;

describe('deployShop network integration', () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends id and domain to deploy endpoint and returns result', async () => {
    const fetchMock = jest.fn(() => ({}) as any);
    global.fetch = fetchMock as any;

    vol.fromJSON({
      '/workspace/base-shop/apps/shop/.env': ''
    }, '/');

    const adapter = {
      scaffold: jest.fn(),
      deploy: jest.fn((id: string, domain?: string) => {
        fetch('https://deploy.test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, domain })
        });
        return { status: 'success' as const, previewUrl: 'url', instructions: undefined };
      }),
      writeDeployInfo: jest.fn(),
    };

    const { deployShop } = await import('../src/createShop/deploy');
    const result = deployShop('shop', 'shop.example.com', adapter as any);

    expect(fetchMock).toHaveBeenCalledWith('https://deploy.test', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'shop', domain: 'shop.example.com' })
    }));
    expect(result).toEqual({ status: 'success', previewUrl: 'url', instructions: undefined });
  });

  it('bubbles up network errors from deploy', async () => {
    const fetchMock = jest.fn(() => { throw new Error('network down'); });
    global.fetch = fetchMock as any;

    vol.fromJSON({
      '/workspace/base-shop/apps/shop/.env': ''
    }, '/');

    const adapter = {
      scaffold: jest.fn(),
      deploy: jest.fn(() => {
        fetch('https://deploy.test');
        return { status: 'success' as const, previewUrl: 'url', instructions: undefined };
      }),
      writeDeployInfo: jest.fn(),
    };

    const { deployShop } = await import('../src/createShop/deploy');
    expect(() => deployShop('shop', undefined, adapter as any)).toThrow('network down');
  });
});

afterAll(() => {
  jest.resetModules();
});
