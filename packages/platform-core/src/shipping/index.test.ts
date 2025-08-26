import { jest } from '@jest/globals';

const mockEnv: Record<string, string | undefined> = {};
jest.mock('@acme/config/env/shipping', () => ({ shippingEnv: mockEnv }));

import { getShippingRate, getTrackingStatus } from './index';

describe('getShippingRate', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error - replace global fetch with mock
    global.fetch = fetchMock;
    for (const key of Object.keys(mockEnv)) {
      delete mockEnv[key];
    }
  });

  it('fetches UPS rate', async () => {
    mockEnv.UPS_KEY = 'ups-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ rate: 10 }),
    });

    const result = await getShippingRate({
      provider: 'ups',
      fromPostalCode: '11111',
      toPostalCode: '22222',
      weight: 5,
    });

    expect(result).toEqual({ rate: 10 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://onlinetools.ups.com/ship/v1/rating/Rate',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer ups-key' }),
      }),
    );
  });

  it('fetches DHL rate', async () => {
    mockEnv.DHL_KEY = 'dhl-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ rate: 20 }),
    });

    const result = await getShippingRate({
      provider: 'dhl',
      fromPostalCode: '33333',
      toPostalCode: '44444',
      weight: 2,
    });

    expect(result).toEqual({ rate: 20 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.dhl.com/rates',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer dhl-key' }),
      }),
    );
  });

  it('throws when API key is missing', async () => {
    await expect(
      getShippingRate({
        provider: 'ups',
        fromPostalCode: '11111',
        toPostalCode: '22222',
        weight: 5,
      }),
    ).rejects.toThrow('Missing UPS_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('premier delivery validation', () => {
    const base = {
      provider: 'premier-shipping' as const,
      fromPostalCode: '00000',
      toPostalCode: '99999',
      weight: 1,
      premierDelivery: {
        regions: ['eligible'],
        windows: ['morning'],
        carriers: ['ups'],
        surcharge: 5,
      },
    };

    it('errors on invalid region', async () => {
      await expect(
        getShippingRate({
          ...base,
          region: 'other',
          window: 'morning',
          carrier: 'ups',
        }),
      ).rejects.toThrow('Region not eligible for premier delivery');
    });

    it('errors on invalid window', async () => {
      await expect(
        getShippingRate({
          ...base,
          region: 'eligible',
          window: 'evening',
          carrier: 'ups',
        }),
      ).rejects.toThrow('Invalid delivery window');
    });

    it('errors on unsupported carrier', async () => {
      await expect(
        getShippingRate({
          ...base,
          region: 'eligible',
          window: 'morning',
          carrier: 'dhl',
        }),
      ).rejects.toThrow('Carrier not supported');
    });
  });
});

describe('getTrackingStatus', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error - replace global fetch with mock
    global.fetch = fetchMock;
  });

  it('returns DHL tracking status', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ shipments: [{ status: { status: 'Delivered' } }] }),
    });

    const result = await getTrackingStatus({ provider: 'dhl', trackingNumber: '123' });
    expect(result).toEqual({
      status: 'Delivered',
      steps: [{ label: 'Delivered', complete: true }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.dhl.com/track/shipments?trackingNumber=123',
    );
  });

  it('returns UPS tracking status', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        trackDetails: [{ packageStatus: { statusType: 'Shipped' } }],
      }),
    });

    const result = await getTrackingStatus({ provider: 'ups', trackingNumber: 'abc' });
    expect(result).toEqual({
      status: 'Shipped',
      steps: [{ label: 'Shipped', complete: true }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=abc',
    );
  });

  it('handles fetch failure', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const result = await getTrackingStatus({ provider: 'dhl', trackingNumber: '123' });
    expect(result).toEqual({ status: null, steps: [] });
  });
});

