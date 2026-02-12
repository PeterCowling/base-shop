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
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
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
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('TC-01: valid config writes outbound draft to Firebase outbox', async () => {
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
    await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/process-messaging-queue',
        method: 'POST',
        body: {
          eventId: 'msg_smoke_123',
        },
        env: createMockEnv(),
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

    const payload = await response.json() as { outcome: string };
    expect(response.status).toBe(200);
    expect(payload.outcome).toBe('idempotent');
    expect(setSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('outboundDrafts/'),
      expect.anything(),
    );
  });
});
