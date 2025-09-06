import { jest } from '@jest/globals';

const mockEnv: Record<string, any> = {};
jest.mock('@acme/config/env/shipping', () => ({ shippingEnv: mockEnv }));

import { getShippingRate, getTrackingStatus } from '../src/shipping/index';

describe('getShippingRate', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error replace global fetch
    global.fetch = fetchMock;
    for (const key of Object.keys(mockEnv)) {
      delete mockEnv[key];
    }
  });

  it('returns rate for valid premier shipping', async () => {
    const result = await getShippingRate({
      provider: 'premier-shipping',
      fromPostalCode: '00000',
      toPostalCode: '99999',
      weight: 1,
      region: 'eligible',
      window: 'morning',
      carrier: 'ups',
      premierDelivery: {
        regions: ['eligible'],
        windows: ['morning'],
        carriers: ['ups'],
        surcharge: 5,
      },
    });
    expect(result).toEqual({
      rate: 0,
      surcharge: 5,
      serviceLabel: 'Premier Delivery',
    });
  });

  it('throws when premierDelivery is missing', async () => {
    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
      }),
    ).rejects.toThrow('Premier delivery not configured');
  });

  it('throws when region is provided without premierDelivery', async () => {
    await expect(
      getShippingRate({
        provider: 'ups',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
        region: 'eligible',
      }),
    ).rejects.toThrow('Premier delivery not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when window is provided without premierDelivery', async () => {
    await expect(
      getShippingRate({
        provider: 'ups',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
        window: 'morning',
      }),
    ).rejects.toThrow('Premier delivery not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when carrier is provided without premierDelivery', async () => {
    await expect(
      getShippingRate({
        provider: 'ups',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
        carrier: 'ups',
      }),
    ).rejects.toThrow('Premier delivery not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws for invalid region', async () => {
    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
        region: 'other',
        window: 'morning',
        carrier: 'ups',
        premierDelivery: {
          regions: ['eligible'],
          windows: ['morning'],
          carriers: ['ups'],
        },
      }),
    ).rejects.toThrow('Region not eligible for premier delivery');
  });

  it('throws for invalid window', async () => {
    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
        region: 'eligible',
        window: 'evening',
        carrier: 'ups',
        premierDelivery: {
          regions: ['eligible'],
          windows: ['morning'],
          carriers: ['ups'],
        },
      }),
    ).rejects.toThrow('Invalid delivery window');
  });

  it('throws for unsupported carrier', async () => {
    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '00000',
        toPostalCode: '99999',
        weight: 1,
        region: 'eligible',
        window: 'morning',
        carrier: 'dhl',
        premierDelivery: {
          regions: ['eligible'],
          windows: ['morning'],
          carriers: ['ups'],
        },
      }),
    ).rejects.toThrow('Carrier not supported');
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

  it('throws when fetch response is not ok', async () => {
    mockEnv.UPS_KEY = 'ups-key';
    fetchMock.mockResolvedValue({ ok: false });
    await expect(
      getShippingRate({
        provider: 'ups',
        fromPostalCode: '11111',
        toPostalCode: '22222',
        weight: 5,
      }),
    ).rejects.toThrow('Failed to fetch rate from ups');
  });

  it('returns JSON for valid non-premier request', async () => {
    mockEnv.UPS_KEY = 'ups-key';
    const apiResponse = { rate: 10 };
    fetchMock.mockResolvedValue({ ok: true, json: async () => apiResponse });
    const result = await getShippingRate({
      provider: 'ups',
      fromPostalCode: '11111',
      toPostalCode: '22222',
      weight: 5,
    });
    expect(result).toEqual(apiResponse);
  });

  it('applies free shipping threshold', async () => {
    mockEnv.UPS_KEY = 'ups-key';
    mockEnv.FREE_SHIPPING_THRESHOLD = 10;
    const result = await getShippingRate({
      provider: 'ups',
      fromPostalCode: '11111',
      toPostalCode: '22222',
      weight: 5,
      toCountry: 'US',
    });
    expect(result).toEqual({ rate: 0, surcharge: 0, serviceLabel: 'Free Shipping' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies zone multiplier and includes dimensions', async () => {
    mockEnv.UPS_KEY = 'ups-key';
    mockEnv.DEFAULT_SHIPPING_ZONE = 'international';
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ rate: 10 }) });
    const result = await getShippingRate({
      provider: 'ups',
      fromPostalCode: '11111',
      toPostalCode: '22222',
      weight: 20,
      toCountry: 'US',
      dimensions: { length: 10, width: 5, height: 2 },
    });
    expect(result).toEqual({ rate: 20, surcharge: undefined, serviceLabel: undefined });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://onlinetools.ups.com/ship/v1/rating/Rate',
      expect.objectContaining({
        body: JSON.stringify({
          fromPostalCode: '11111',
          toPostalCode: '22222',
          weight: 20,
          dimensions: { length: 10, width: 5, height: 2 },
        }),
      }),
    );
  });

  describe('country filtering', () => {
    it('allows shipping to allowed country', async () => {
      mockEnv.UPS_KEY = 'ups-key';
      mockEnv.ALLOWED_COUNTRIES = ['US', 'CA'];
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ rate: 7 }) });
      const result = await getShippingRate({
        provider: 'ups',
        fromPostalCode: '11111',
        toPostalCode: '22222',
        weight: 15,
        toCountry: 'US',
      });
      expect(result.rate).toBe(7);
    });

    it('rejects disallowed country', async () => {
      mockEnv.ALLOWED_COUNTRIES = ['US'];
      await expect(
        getShippingRate({
          provider: 'ups',
          fromPostalCode: '11111',
          toPostalCode: '22222',
          weight: 15,
          toCountry: 'CA',
        }),
      ).rejects.toThrow('Shipping not available to destination');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

describe('getTrackingStatus', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // @ts-expect-error replace global fetch
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
  });

  it('falls back on network error', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const result = await getTrackingStatus({ provider: 'dhl', trackingNumber: '123' });
    expect(result).toEqual({ status: null, steps: [] });
  });

  it('falls back on non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const result = await getTrackingStatus({ provider: 'ups', trackingNumber: 'abc' });
    expect(result).toEqual({ status: null, steps: [] });
  });
});
