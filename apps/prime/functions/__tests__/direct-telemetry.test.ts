/**
 * @jest-environment node
 */

import { onRequestGet } from '../api/direct-telemetry';
import { buildDirectTelemetryKey } from '../lib/direct-telemetry';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

describe('/api/direct-telemetry', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          users: [
            {
              localId: 'staff_operator_1',
              customAttributes: JSON.stringify({ role: 'staff' }),
            },
          ],
        }),
        { status: 200 },
      )) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('TC-01: returns windowed telemetry totals for authorized staff', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-24T12:00:00.000Z'));

    const kv = createMockKv({
      [buildDirectTelemetryKey('write.success', '2026-02-23')]: '2',
      [buildDirectTelemetryKey('write.success', '2026-02-24')]: '3',
      [buildDirectTelemetryKey('read.rate_limited', '2026-02-24')]: '1',
    });
    const env = createMockEnv({ RATE_LIMIT: kv });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-telemetry?days=2',
        env,
        headers: {
          Authorization: 'Bearer staff-token-123',
        },
      }),
    );

    const payload = await response.json() as {
      requestedBy: string;
      windowDays: number;
      dayBuckets: string[];
      totals: Record<string, number>;
      byDay: Record<string, Record<string, number>>;
    };

    expect(response.status).toBe(200);
    expect(payload.requestedBy).toBe('staff_operator_1');
    expect(payload.windowDays).toBe(2);
    expect(payload.dayBuckets).toEqual(['2026-02-23', '2026-02-24']);
    expect(payload.totals['write.success']).toBe(5);
    expect(payload.totals['read.rate_limited']).toBe(1);
    expect(payload.byDay['2026-02-23']['write.success']).toBe(2);
    expect(payload.byDay['2026-02-24']['write.success']).toBe(3);
    expect(payload.byDay['2026-02-24']['read.rate_limited']).toBe(1);
  });

  it('TC-02: rejects missing staff auth token', async () => {
    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-telemetry',
      }),
    );

    expect(response.status).toBe(401);
  });

  it('TC-03: rejects invalid days parameter', async () => {
    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-telemetry?days=31',
        headers: {
          Authorization: 'Bearer staff-token-123',
        },
      }),
    );

    expect(response.status).toBe(400);
  });
});
