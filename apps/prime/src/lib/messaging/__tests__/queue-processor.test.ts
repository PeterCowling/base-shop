import { processArrival48HoursQueueRecord } from '../queue-processor';
import {
  bookingConfirmedPayloadSchema,
  createQueueRecord,
  MessagingEventType,
  type MessagingQueueRecord,
  messagingQueueRecordSchema,
} from '../triggers';

function createArrival48Record(
  overrides: Partial<MessagingQueueRecord> = {},
): MessagingQueueRecord {
  return {
    eventId: 'msg_abc123',
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
    ...overrides,
  };
}

describe('queue processor spike', () => {
  it('TC-01: booking.confirmed queue record validates schema and enqueues once per booking', () => {
    const bookingConfirmedPayload = bookingConfirmedPayloadSchema.parse({
      eventType: MessagingEventType.BOOKING_CONFIRMED,
      uuid: 'occ_1234567890123',
      bookingCode: 'BOOK-123',
      email: 'guest@example.com',
      firstName: 'Alex',
      language: 'en',
      checkInDate: '2026-02-15',
      checkOutDate: '2026-02-18',
      nights: 3,
      portalUrl: 'https://prime.example.com/portal',
    });

    const firstRecord = createQueueRecord(MessagingEventType.BOOKING_CONFIRMED, bookingConfirmedPayload);
    const secondRecord = createQueueRecord(MessagingEventType.BOOKING_CONFIRMED, bookingConfirmedPayload);

    expect(messagingQueueRecordSchema.safeParse(firstRecord).success).toBe(true);
    expect(firstRecord.eventId).toBe('msg_booking_confirmed_book_123');
    expect(secondRecord.eventId).toBe(firstRecord.eventId);
  });

  it('TC-01: pending event is processed once and marked sent', async () => {
    const dispatchArrival48Hours = jest.fn(async () => undefined);
    const now = jest.fn(() => 1700000001111);

    const result = await processArrival48HoursQueueRecord(
      createArrival48Record(),
      { dispatchArrival48Hours, now },
    );

    expect(dispatchArrival48Hours).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      outcome: 'sent',
      transition: {
        status: 'sent',
        retryCount: 0,
        lastError: null,
        processedAt: 1700000001111,
      },
    });
  });

  it('TC-02: duplicate processing attempt is idempotently ignored', async () => {
    const dispatchArrival48Hours = jest.fn(async () => undefined);

    const result = await processArrival48HoursQueueRecord(
      createArrival48Record({ status: 'sent' }),
      { dispatchArrival48Hours },
    );

    expect(dispatchArrival48Hours).not.toHaveBeenCalled();
    expect(result.outcome).toBe('idempotent');
    expect(result.reason).toBe('already_sent');
    expect(result.transition).toBeNull();
  });

  it('TC-03: provider transient failure increments retry count and preserves event', async () => {
    const dispatchArrival48Hours = jest.fn(async () => {
      throw new Error('Transient timeout');
    });

    const result = await processArrival48HoursQueueRecord(
      createArrival48Record({ retryCount: 2 }),
      { dispatchArrival48Hours },
    );

    expect(result).toEqual({
      outcome: 'retry',
      transition: {
        status: 'pending',
        retryCount: 3,
        lastError: 'Transient timeout',
        processedAt: null,
      },
    });
  });

  it('TC-04: permanent failure marks event failed with lastError', async () => {
    const dispatchArrival48Hours = jest.fn(async () => {
      throw { message: 'Template missing', permanent: true };
    });
    const now = jest.fn(() => 1700000002222);

    const result = await processArrival48HoursQueueRecord(
      createArrival48Record({ retryCount: 1 }),
      { dispatchArrival48Hours, now },
    );

    expect(result).toEqual({
      outcome: 'failed',
      transition: {
        status: 'failed',
        retryCount: 2,
        lastError: 'Template missing',
        processedAt: 1700000002222,
      },
    });
  });
});
