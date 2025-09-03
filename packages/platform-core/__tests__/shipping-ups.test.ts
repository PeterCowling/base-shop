import { jest } from '@jest/globals';

const mockEnv: Record<string, string | undefined> = {};
jest.mock('@acme/config/env/shipping', () => ({ shippingEnv: mockEnv }));

import { createReturnLabel, getStatus } from '../src/shipping/ups';

describe('createReturnLabel', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error replace global fetch
    global.fetch = fetchMock;
    for (const key of Object.keys(mockEnv)) {
      delete mockEnv[key];
    }
    jest.spyOn(Math, 'random').mockReturnValue(0.1234567891);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses fallback when UPS_KEY is missing', async () => {
    const result = await createReturnLabel('session');
    expect(result).toEqual({
      trackingNumber: '1Z1234567891',
      labelUrl: 'https://www.ups.com/track?loc=en_US&tracknum=1Z1234567891',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requests return label when UPS_KEY exists', async () => {
    mockEnv.UPS_KEY = 'ups-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ShipmentResults: {
          PackageResults: {
            TrackingNumber: 'TRACK123',
            LabelURL: 'https://label.url',
          },
        },
      }),
    });

    const result = await createReturnLabel('session');
    expect(result).toEqual({
      trackingNumber: 'TRACK123',
      labelUrl: 'https://label.url',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://onlinetools.ups.com/ship/v1/shipments',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer ups-key' }),
      }),
    );
  });
});

describe('getStatus', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error replace global fetch
    global.fetch = fetchMock;
  });

  it('returns status type from response', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        trackDetails: [{ packageStatus: { statusType: 'Delivered' } }],
      }),
    });

    await expect(getStatus('1Z123')).resolves.toBe('Delivered');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=1Z123',
    );
  });

  it('returns null on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    await expect(getStatus('1Z123')).resolves.toBeNull();
  });
});
