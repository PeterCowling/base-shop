import { jest } from '@jest/globals';

describe('shipping getTrackingStatus', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns UPS tracking status', async () => {
    global.fetch = (jest.fn(async () =>
      new Response(
        JSON.stringify({ trackDetails: [{ packageStatus: { statusType: 'Delivered' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ) as unknown) as typeof fetch;

    const { getTrackingStatus } = await import('../src/shipping');
    const res = await getTrackingStatus({ provider: 'ups', trackingNumber: '1Z' });
    expect(res).toEqual({ status: 'Delivered', steps: [{ label: 'Delivered', complete: true }] });
  });

  it('returns DHL tracking status', async () => {
    global.fetch = (jest.fn(async () =>
      new Response(
        JSON.stringify({ shipments: [{ status: { status: 'In transit' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ) as unknown) as typeof fetch;

    const { getTrackingStatus } = await import('../src/shipping');
    const res = await getTrackingStatus({ provider: 'dhl', trackingNumber: 'X' });
    expect(res).toEqual({ status: 'In transit', steps: [{ label: 'In transit', complete: true }] });
  });

  it('falls back on fetch error', async () => {
    global.fetch = (jest.fn(async () => { throw new Error('net'); }) as unknown) as typeof fetch;
    const { getTrackingStatus } = await import('../src/shipping');
    const res = await getTrackingStatus({ provider: 'ups', trackingNumber: '1Z' });
    expect(res).toEqual({ status: null, steps: [] });
  });
});

