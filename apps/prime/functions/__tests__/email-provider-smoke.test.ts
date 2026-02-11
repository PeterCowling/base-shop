/**
 * @jest-environment node
 */

import { MessagingEventType } from '../../src/lib/messaging/triggers';
import { onRequestPost } from '../api/process-messaging-queue';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createPagesContext } from './helpers';

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
  const updateSpy = jest.spyOn(FirebaseRest.prototype, 'update');
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    getSpy.mockResolvedValue(createArrival48HoursQueueRecord());
    updateSpy.mockResolvedValue(undefined);
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(() => {
    getSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('TC-01: valid staging config sends one deterministic smoke message', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body: {
          eventId: 'msg_smoke_123',
        },
        env: createMockEnv({
          PRIME_EMAIL_WEBHOOK_URL: 'https://email.example.com/webhook',
          PRIME_EMAIL_WEBHOOK_TOKEN: 'stage-token-abc',
        }),
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://email.example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer stage-token-abc',
        }),
      }),
    );
  });

  it('TC-02: missing provider config fails fast with actionable diagnostics', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body: {
          eventId: 'msg_smoke_123',
        },
        env: createMockEnv(),
      }),
    );

    const payload = await response.json() as {
      outcome: string;
      transition?: { status: string; retryCount: number; lastError: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('failed');
    expect(payload.transition).toMatchObject({
      status: 'failed',
      retryCount: 1,
      lastError: 'Prime email provider is not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TC-03: invalid token/key fails closed and records explicit error', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }));

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body: {
          eventId: 'msg_smoke_123',
        },
        env: createMockEnv({
          PRIME_EMAIL_WEBHOOK_URL: 'https://email.example.com/webhook',
          PRIME_EMAIL_WEBHOOK_TOKEN: 'invalid-stage-token',
        }),
      }),
    );

    const payload = await response.json() as {
      outcome: string;
      transition?: { status: string; retryCount: number; lastError: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('failed');
    expect(payload.transition).toMatchObject({
      status: 'failed',
      retryCount: 1,
      lastError: 'Email webhook failed: 401',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
