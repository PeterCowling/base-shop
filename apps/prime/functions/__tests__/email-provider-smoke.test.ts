/**
 * @jest-environment node
 */

import { createHmac } from 'node:crypto';

import { MessagingEventType } from '../../src/lib/messaging/triggers';
import { onRequestPost } from '../api/process-messaging-queue';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

const QUEUE_TOKEN = 'queue-token-123';

function signQueueBody(
  body: Record<string, unknown>,
  token: string,
  timestampSeconds: number,
): string {
  const payload = `${timestampSeconds}.${JSON.stringify(body)}`;
  return createHmac('sha256', token).update(payload).digest('hex');
}

function createQueueAuthHeaders(
  body: Record<string, unknown>,
  options: {
    authToken?: string;
    signatureToken?: string;
    timestampSeconds?: number;
    extra?: Record<string, string>;
  } = {},
): Record<string, string> {
  const authToken = options.authToken ?? QUEUE_TOKEN;
  const signatureToken = options.signatureToken ?? QUEUE_TOKEN;
  const timestampSeconds = options.timestampSeconds ?? Math.floor(Date.now() / 1000);
  const signature = signQueueBody(body, signatureToken, timestampSeconds);

  return {
    Authorization: `Bearer ${authToken}`,
    'X-Prime-Queue-Timestamp': String(timestampSeconds),
    'X-Prime-Queue-Signature': signature,
    ...options.extra,
  };
}

function createArrival48HoursQueueRecord() {
  return {
    eventId: 'msg_smoke_123',
    eventType: MessagingEventType.ARRIVAL_48_HOURS,
    payload: {
      eventType: MessagingEventType.ARRIVAL_48_HOURS,
      uuid: 'occ_1234567890123',
      bookingCode: 'BOOK-123',
      email: 'guest@example.com',
      firstName: 'Alex',
      language: 'en',
      checkInDate: '2026-02-15',
      cityTaxDue: 12,
      depositDue: 20,
      etaConfirmed: true,
      cashPrepared: false,
      portalUrl: 'https://prime.example.com/portal',
    },
    createdAt: 1700000000000,
    status: 'pending',
    retryCount: 0,
    lastError: null,
    processedAt: null,
  };
}

describe('email provider smoke spike', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  const getWithEtagSpy = jest.spyOn(FirebaseRest.prototype, 'getWithEtag');
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
  const setIfMatchSpy = jest.spyOn(FirebaseRest.prototype, 'setIfMatch');
  const updateSpy = jest.spyOn(FirebaseRest.prototype, 'update');

  beforeEach(() => {
    jest.clearAllMocks();
    getSpy.mockImplementation(async (path: string) => {
      // Queue record lookup
      if (path.startsWith('messagingQueue/')) {
        return createArrival48HoursQueueRecord();
      }
      // Booking checkout date lookup (used by deep link generation)
      if (path.startsWith('bookings/')) {
        return { checkOutDate: '2026-02-17' };
      }
      return null;
    });
    setSpy.mockResolvedValue(undefined);
    getWithEtagSpy.mockImplementation(async (path: string) => ({
      data: await getSpy(path),
      etag: 'test-etag',
    }));
    setIfMatchSpy.mockImplementation(async (_path: string, data: unknown) => {
      await setSpy('messagingQueue/msg_smoke_123', data);
      return {
        applied: true,
        data,
        etag: 'test-etag-2',
      };
    });
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    getWithEtagSpy.mockRestore();
    setSpy.mockRestore();
    setIfMatchSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('TC-01: valid config writes outbound draft to Firebase outbox', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as {
      outcome: string;
      transition?: { status: string; retryCount: number; lastError: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('sent');
    expect(payload.transition).toMatchObject({
      status: 'sent',
      retryCount: 0,
      lastError: null,
    });

    // Verify outbound draft was written to Firebase
    expect(setSpy).toHaveBeenCalledWith(
      'outboundDrafts/msg_smoke_123',
      expect.objectContaining({
        to: 'guest@example.com',
        subject: expect.stringContaining('Arriving soon, Alex'),
        bodyText: expect.stringContaining('Alex'),
        category: 'pre-arrival',
        guestName: 'Alex',
        bookingCode: 'BOOK-123',
        eventId: 'msg_smoke_123',
        status: 'pending',
        createdAt: expect.any(String),
      }),
    );
  });

  it('TC-02: outbound draft body includes luggage warning and deep link', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const outboxCall = setSpy.mock.calls.find(
      ([path]) => typeof path === 'string' && path.startsWith('outboundDrafts/'),
    );
    expect(outboxCall).toBeDefined();

    const record = outboxCall![1] as { bodyText: string; subject: string };
    expect(record.bodyText).toContain('DO NOT arrive by ferry');
    expect(record.bodyText).toContain('EUR 32.00');
    expect(record.bodyText).toContain('/g/');
    expect(record.subject).toContain('read this before you travel');
  });

  it('TC-03: queue record for non-pending status returns idempotent', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path.startsWith('messagingQueue/')) {
        return { ...createArrival48HoursQueueRecord(), status: 'sent' };
      }
      return null;
    });

    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as { outcome: string };
    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('idempotent');
    expect(setSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('outboundDrafts/'),
      expect.anything(),
    );
  });

  it('TC-04: missing queue token config fails closed', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body),
        env: createMockEnv(),
      }),
    );

    const payload = await response.json() as { error: string };
    expect(response.status).toBe(503);
    expect(payload.error).toBe('Prime email provider is not configured');
  });

  it('TC-05: invalid authorization token is rejected', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body, { authToken: 'wrong-token' }),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as { error: string };
    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
  });

  it('TC-06: invalid queue signature is rejected', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body, { signatureToken: 'wrong-signature-token' }),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as { error: string };
    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
  });

  it('TC-07: stale queue signature timestamp is rejected', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const staleTimestamp = Math.floor(Date.now() / 1000) - (10 * 60);
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body, { timestampSeconds: staleTimestamp }),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as { error: string };
    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
  });

  it('TC-08: missing signature headers are rejected', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: {
          Authorization: `Bearer ${QUEUE_TOKEN}`,
        },
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as { error: string };
    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
  });

  it('TC-09: missing checkout date fails permanent and does not enqueue outbound draft', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path.startsWith('messagingQueue/')) {
        return createArrival48HoursQueueRecord();
      }
      if (path.startsWith('bookings/')) {
        return {};
      }
      return null;
    });

    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body),
        env: createMockEnv({ PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN }),
      }),
    );

    const payload = await response.json() as {
      outcome: string;
      transition?: { status: string; lastError: string };
    };

    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('failed');
    expect(payload.transition?.status).toBe('failed');
    expect(payload.transition?.lastError).toContain('Invalid or missing checkout date');
    expect(setSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('outboundDrafts/'),
      expect.anything(),
    );
  });

  it('TC-10: dedicated signature secret is accepted when bearer token differs', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers: createQueueAuthHeaders(body, { signatureToken: 'sig-secret-123' }),
        env: createMockEnv({
          PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN,
          PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET: 'sig-secret-123',
        }),
      }),
    );

    const payload = await response.json() as { outcome: string };
    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('sent');
  });

  it('TC-11: replayed valid signature is rejected when replay guard is enabled', async () => {
    const body = {
      eventId: 'msg_smoke_123',
    };
    const timestampSeconds = Math.floor(Date.now() / 1000);
    const headers = createQueueAuthHeaders(body, {
      timestampSeconds,
      signatureToken: 'sig-secret-123',
    });
    const env = createMockEnv({
      PRIME_EMAIL_WEBHOOK_TOKEN: QUEUE_TOKEN,
      PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET: 'sig-secret-123',
      RATE_LIMIT: createMockKv(),
    });

    const firstResponse = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers,
        env,
      }),
    );
    const secondResponse = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body,
        headers,
        env,
      }),
    );

    const firstPayload = await firstResponse.json() as { outcome: string };
    const secondPayload = await secondResponse.json() as { error: string };
    expect(firstResponse.status).toBe(200);
    expect(firstPayload.outcome).toBe('sent');
    expect(secondResponse.status).toBe(401);
    expect(secondPayload.error).toBe('Unauthorized');
  });
});
