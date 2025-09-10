import { jest } from '@jest/globals';

describe('shipping/ups', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
    jest.clearAllMocks();
  });

  function mockEnv(key: string | undefined) {
    jest.doMock('@acme/config/env/shipping', () => ({ shippingEnv: { UPS_KEY: key } }), { virtual: true });
  }

  it('createReturnLabel: returns fallback when UPS_KEY missing', async () => {
    mockEnv(undefined);
    const { createReturnLabel } = await import('../ups');
    const orig = Math.random;
    Math.random = () => 0.987654321;
    const out = await createReturnLabel('s');
    expect(out.trackingNumber).toBe('1Z9876543210');
    expect(out.labelUrl).toContain(out.trackingNumber);
    Math.random = orig;
  });

  it('createReturnLabel: returns parsed label on success', async () => {
    mockEnv('k');
    global.fetch = (jest.fn(async () =>
      new Response(
        JSON.stringify({ ShipmentResults: { PackageResults: { TrackingNumber: 'TN', LabelURL: 'LURL' } } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown) as typeof fetch;
    const { createReturnLabel } = await import('../ups');
    const out = await createReturnLabel('s');
    expect(out).toEqual({ trackingNumber: 'TN', labelUrl: 'LURL' });
  });

  it('getStatus: returns parsed value and null on error', async () => {
    mockEnv('k');
    // ok
    global.fetch = (jest.fn(async () =>
      new Response(JSON.stringify({ trackDetails: [{ packageStatus: { statusType: 'Out for delivery' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ) as unknown) as typeof fetch;
    const { getStatus } = await import('../ups');
    const ok = await getStatus('X');
    expect(ok).toBe('Out for delivery');
    // failure
    global.fetch = (jest.fn(async () => { throw new Error('net'); }) as unknown) as typeof fetch;
    const fail = await getStatus('Y');
    expect(fail).toBeNull();
  });
});

