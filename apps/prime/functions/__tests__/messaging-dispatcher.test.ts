/**
 * @jest-environment node
 */

import { MessagingEventType } from '../../src/lib/messaging/triggers';
import { dispatchQueuedArrival48HoursEvent } from '../lib/messaging-dispatcher';

function createQueueRecord(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'msg_test_123',
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

function createQueueStore(initialRecord: Record<string, unknown>) {
  const path = 'messagingQueue/msg_test_123';
  const records = new Map<string, Record<string, unknown>>([[path, { ...initialRecord }]]);

  const queueStore = {
    get: jest.fn(async (targetPath: string) => records.get(targetPath) ?? null),
    update: jest.fn(async (targetPath: string, data: Partial<Record<string, unknown>>) => {
      const current = records.get(targetPath) ?? {};
      records.set(targetPath, { ...current, ...data });
    }),
  };

  return {
    queueStore,
    read: () => records.get(path),
  };
}

describe('messaging dispatcher spike', () => {
  it('TC-01: pending event is processed once and marked sent', async () => {
    const store = createQueueStore(createQueueRecord());
    const dispatchArrival48Hours = jest.fn(async () => undefined);
    const now = jest.fn(() => 1700000001111);

    const result = await dispatchQueuedArrival48HoursEvent('msg_test_123', {
      queueStore: store.queueStore,
      dispatchArrival48Hours,
      now,
    });

    expect(result.outcome).toBe('sent');
    expect(dispatchArrival48Hours).toHaveBeenCalledTimes(1);
    expect(store.queueStore.update).toHaveBeenCalledTimes(2);
    expect(store.read()).toMatchObject({
      status: 'sent',
      retryCount: 0,
      lastError: null,
      processedAt: 1700000001111,
    });
  });

  it('TC-02: duplicate processing attempt is idempotently ignored', async () => {
    const store = createQueueStore(createQueueRecord({ status: 'sent' }));
    const dispatchArrival48Hours = jest.fn(async () => undefined);

    const result = await dispatchQueuedArrival48HoursEvent('msg_test_123', {
      queueStore: store.queueStore,
      dispatchArrival48Hours,
    });

    expect(result).toMatchObject({
      outcome: 'idempotent',
      reason: 'already_sent',
    });
    expect(dispatchArrival48Hours).not.toHaveBeenCalled();
    expect(store.queueStore.update).not.toHaveBeenCalled();
  });

  it('TC-03: provider transient failure increments retry count and preserves event', async () => {
    const store = createQueueStore(createQueueRecord());
    const dispatchArrival48Hours = jest.fn(async () => {
      throw new Error('SMTP timeout');
    });

    const result = await dispatchQueuedArrival48HoursEvent('msg_test_123', {
      queueStore: store.queueStore,
      dispatchArrival48Hours,
    });

    expect(result.outcome).toBe('retry');
    expect(store.read()).toMatchObject({
      status: 'pending',
      retryCount: 1,
      lastError: 'SMTP timeout',
      processedAt: null,
    });
  });

  it('TC-04: permanent failure marks event failed with lastError', async () => {
    const store = createQueueStore(createQueueRecord());
    const dispatchArrival48Hours = jest.fn(async () => {
      throw { message: 'Recipient rejected', permanent: true };
    });
    const now = jest.fn(() => 1700000002222);

    const result = await dispatchQueuedArrival48HoursEvent('msg_test_123', {
      queueStore: store.queueStore,
      dispatchArrival48Hours,
      now,
    });

    expect(result.outcome).toBe('failed');
    expect(store.read()).toMatchObject({
      status: 'failed',
      retryCount: 1,
      lastError: 'Recipient rejected',
      processedAt: 1700000002222,
    });
  });
});

