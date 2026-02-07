import { jest } from '@jest/globals';

import { createReturnLabel, getStatus } from '../src/shipping/ups';

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __upsTestMockEnv: Record<string, string | undefined> | undefined;
}
globalThis.__upsTestMockEnv = {};

jest.mock('@acme/config/env/shipping', () => ({
  get shippingEnv() {
    return globalThis.__upsTestMockEnv ?? {};
  },
}));

const mockEnv = globalThis.__upsTestMockEnv!;

describe('createReturnLabel', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    for (const key of Object.keys(mockEnv)) {
      delete mockEnv[key];
    }
  });

  it('returns fallback when UPS_KEY missing', async () => {
    const result = await createReturnLabel('session');
    expect(result.trackingNumber).toMatch(/^1Z\d{10}$/);
    expect(result.labelUrl).toContain(result.trackingNumber);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns API data when request succeeds', async () => {
    mockEnv.UPS_KEY = 'key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ShipmentResults: {
          PackageResults: {
            TrackingNumber: '1Z999',
            LabelURL: 'https://label',
          },
        },
      }),
    });
    const result = await createReturnLabel('session');
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual({
      trackingNumber: '1Z999',
      labelUrl: 'https://label',
    });
  });

  it('falls back when response is not ok', async () => {
    mockEnv.UPS_KEY = 'key';
    fetchMock.mockResolvedValue({ ok: false });
    const result = await createReturnLabel('session');
    expect(result.trackingNumber).toMatch(/^1Z\d{10}$/);
    expect(result.labelUrl).toContain(result.trackingNumber);
  });

  it('falls back on fetch error', async () => {
    mockEnv.UPS_KEY = 'key';
    fetchMock.mockRejectedValue(new Error('network'));
    const result = await createReturnLabel('session');
    expect(result.trackingNumber).toMatch(/^1Z\d{10}$/);
    expect(result.labelUrl).toContain(result.trackingNumber);
  });

  it('falls back when API omits label details', async () => {
    mockEnv.UPS_KEY = 'key';
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const result = await createReturnLabel('session');
    expect(result.trackingNumber).toMatch(/^1Z\d{10}$/);
    expect(result.labelUrl).toContain(result.trackingNumber);
  });
});

describe('getStatus', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('returns status when API succeeds', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        trackDetails: [{ packageStatus: { statusType: 'IN_TRANSIT' } }],
      }),
    });
    await expect(getStatus('1Z999')).resolves.toBe('IN_TRANSIT');
  });

  it('returns null on error', async () => {
    fetchMock.mockRejectedValue(new Error('oops'));
    await expect(getStatus('1Z999')).resolves.toBeNull();
  });
});

