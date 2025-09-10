import { jest } from '@jest/globals';

describe('shipping index', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
    jest.clearAllMocks();
  });

  function mockShippingEnv(env: Record<string, unknown>) {
    jest.doMock('@acme/config/env/shipping', () => ({ shippingEnv: env }), { virtual: true });
  }

  it('returns premier delivery rate with surcharge and label', async () => {
    mockShippingEnv({});
    const { getShippingRate } = await import('../index');
    const res = await getShippingRate({
      provider: 'premier-shipping',
      fromPostalCode: '10001',
      toPostalCode: '94105',
      weight: 2,
      region: 'US',
      window: 'AM',
      carrier: 'bike',
      premierDelivery: {
        regions: ['US', 'EU'],
        windows: ['AM', 'PM'],
        carriers: ['bike', 'van'],
        surcharge: 4.5,
        serviceLabel: 'Premier Delivery',
      },
    });
    expect(res).toEqual({ rate: 0, surcharge: 4.5, serviceLabel: 'Premier Delivery' });
  });

  it('validates premier delivery configuration and rejects invalid region/window/carrier', async () => {
    mockShippingEnv({});
    const { getShippingRate } = await import('../index');
    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '10001',
        toPostalCode: '94105',
        weight: 2,
        // missing premierDelivery
      } as unknown as Parameters<typeof getShippingRate>[0])
    ).rejects.toThrow(/Premier delivery not configured/);

    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '10001',
        toPostalCode: '94105',
        weight: 2,
        region: 'CA',
        window: 'AM',
        premierDelivery: { regions: ['US'], windows: ['AM'] },
      })
    ).rejects.toThrow(/Region not eligible/);

    await expect(
      getShippingRate({
        provider: 'premier-shipping',
        fromPostalCode: '10001',
        toPostalCode: '94105',
        weight: 2,
        region: 'US',
        window: 'EVE',
        premierDelivery: { regions: ['US'], windows: ['AM'] },
      })
    ).rejects.toThrow(/Invalid delivery window/);
  });

  it('requires API key and throws when missing for UPS', async () => {
    mockShippingEnv({ UPS_KEY: undefined });
    const { getShippingRate } = await import('../index');
    await expect(
      getShippingRate({ provider: 'ups', fromPostalCode: '10001', toPostalCode: '94105', weight: 1 })
    ).rejects.toThrow(/Missing UPS_KEY/);
  });

  it('fetches UPS rate successfully', async () => {
    mockShippingEnv({ UPS_KEY: 'test-key' });
    const fetchMock = jest.fn(async () =>
      new Response(JSON.stringify({ rate: 9.99, surcharge: 1.1, serviceLabel: 'UPS Ground' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { getShippingRate } = await import('../index');
    const res = await getShippingRate({ provider: 'ups', fromPostalCode: '10001', toPostalCode: '94105', weight: 3 });
    expect(res).toEqual({ rate: 9.99, surcharge: 1.1, serviceLabel: 'UPS Ground' });
    expect(fetchMock).toHaveBeenCalled();
  });

  it('propagates fetch failure for UPS rate', async () => {
    mockShippingEnv({ UPS_KEY: 'test-key' });
    const fetchMock = jest.fn(async () => new Response('err', { status: 500 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { getShippingRate } = await import('../index');
    await expect(
      getShippingRate({ provider: 'ups', fromPostalCode: '10001', toPostalCode: '94105', weight: 3 })
    ).rejects.toThrow(/Failed to fetch rate from ups/);
  });

  it('tracks DHL and UPS statuses and falls back on non-ok', async () => {
    mockShippingEnv({});
    const { getTrackingStatus } = await import('../index');
    // DHL ok
    global.fetch = (jest.fn(async () =>
      new Response(JSON.stringify({ shipments: [{ status: { status: 'In transit' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as unknown) as typeof fetch;
    const dhl = await getTrackingStatus({ provider: 'dhl', trackingNumber: 'X' });
    expect(dhl).toEqual({ status: 'In transit', steps: [{ label: 'In transit', complete: true }] });

    // UPS ok
    global.fetch = (jest.fn(async () =>
      new Response(JSON.stringify({ trackDetails: [{ packageStatus: { statusType: 'Delivered' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as unknown) as typeof fetch;
    const ups = await getTrackingStatus({ provider: 'ups', trackingNumber: 'Y' });
    expect(ups).toEqual({ status: 'Delivered', steps: [{ label: 'Delivered', complete: true }] });

    // Non-ok -> fallback
    global.fetch = (jest.fn(async () => new Response('x', { status: 500 })) as unknown) as typeof fetch;
    const fail = await getTrackingStatus({ provider: 'ups', trackingNumber: 'Z' });
    expect(fail).toEqual({ status: null, steps: [] });
  });

  it('createReturnLabel returns fallback without UPS_KEY and on failure', async () => {
    // No key
    mockShippingEnv({ UPS_KEY: undefined });
    const { createReturnLabel } = await import('../index');
    // Stabilize Math.random for deterministic fallback
    const origRand = Math.random;
    Math.random = () => 0.1234567890;
    const noKey = await createReturnLabel('sess');
    expect(noKey).toEqual({
      trackingNumber: '1Z1234567890',
      labelUrl: 'https://www.ups.com/track?loc=en_US&tracknum=1Z1234567890',
    });
    Math.random = origRand;

    // Key present but API non-ok -> fallback
    mockShippingEnv({ UPS_KEY: 'key' });
    global.fetch = (jest.fn(async () => new Response('x', { status: 500 })) as unknown) as typeof fetch;
    const fallback = await createReturnLabel('sess');
    expect(fallback.trackingNumber).toMatch(/^1Z/);
    expect(fallback.labelUrl).toContain('track');
  });
});

