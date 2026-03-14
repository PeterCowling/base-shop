/**
 * @jest-environment node
 */

import { onRequestPost } from '../api/activity-message';
import { FirebaseRest } from '../lib/firebase-rest';

import {
  createMockD1Database,
  createMockEnv,
  createMockKv,
  createPagesContext,
  normalizeD1Query,
} from './helpers';

describe('/api/activity-message', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
  const updateSpy = jest.spyOn(FirebaseRest.prototype, 'update');
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* suppress during test */ });

  beforeEach(() => {
    jest.clearAllMocks();
    setSpy.mockResolvedValue(undefined);
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
    updateSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('TC-06: valid session + valid body → 200 with success, messageId, createdAt', async () => {
    const activityId = 'act-uuid-001';
    const senderUuid = 'occ_aaa';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: senderUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${activityId}/meta`) {
        return null;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        env: createMockEnv({ RATE_LIMIT: createMockKv() }),
        headers: { 'X-Prime-Guest-Token': 'token-1' },
        body: {
          activityId,
          channelId: activityId,
          content: 'Hello activity channel',
        },
      }),
    );

    const payload = await response.json() as {
      success: boolean;
      messageId: string;
      createdAt: number;
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.messageId).toContain('msg_');
    expect(typeof payload.createdAt).toBe('number');

    // Meta created with correct activity shape
    expect(setSpy).toHaveBeenCalledWith(
      `messaging/channels/${activityId}/meta`,
      expect.objectContaining({
        channelType: 'activity',
        bookingId: 'activity',
        audience: 'whole_hostel',
      }),
    );

    // Message written with correct shape
    const messageWriteCall = setSpy.mock.calls.find(([path]) =>
      typeof path === 'string'
      && path.startsWith(`messaging/channels/${activityId}/messages/msg_`),
    );
    expect(messageWriteCall).toBeDefined();
    expect(messageWriteCall?.[1]).toEqual(
      expect.objectContaining({
        content: 'Hello activity channel',
        senderId: senderUuid,
        senderRole: 'guest',
        kind: 'support',
        audience: 'whole_hostel',
      }),
    );
  });

  it('TC-07: missing prime_session cookie → 401', async () => {
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        body: {
          activityId: 'act-uuid-001',
          channelId: 'act-uuid-001',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(getSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('TC-08: invalid/expired session token → 401', async () => {
    getSpy.mockResolvedValue(null); // guestSessionsByToken returns null = not found

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        headers: { 'X-Prime-Guest-Token': 'bad-token' },
        body: {
          activityId: 'act-uuid-001',
          channelId: 'act-uuid-001',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('TC-09: rate limit exceeded → 429 with Retry-After header', async () => {
    const kv = createMockKv({ 'activity-message:write:occ_aaa': '40' });
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_aaa',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        env,
        headers: { 'X-Prime-Guest-Token': 'token-1' },
        body: {
          activityId: 'act-uuid-001',
          channelId: 'act-uuid-001',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(setSpy).not.toHaveBeenCalled();
    expect(kv.put).toHaveBeenCalledWith(
      expect.stringMatching(/^direct-telemetry:activity\.write\.rate_limited:\d{4}-\d{2}-\d{2}$/),
      '1',
      expect.objectContaining({ expirationTtl: 35 * 24 * 60 * 60 }),
    );
  });

  it('TC-10: missing activityId, channelId, or content → 400', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_aaa',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        headers: { 'X-Prime-Guest-Token': 'token-1' },
        body: {
          activityId: 'act-uuid-001',
          // channelId missing
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('TC-11: shadow-write failure does not surface to guest — response is still 200', async () => {
    const activityId = 'act-uuid-fire-forget';
    const { db } = createMockD1Database();
    // Force D1 prepare to throw to simulate shadow-write failure
    const failDb = {
      prepare: () => { throw new Error('D1 unavailable'); },
      batch: async () => [],
    };
    const env = createMockEnv({ PRIME_MESSAGING_DB: failDb as any, RATE_LIMIT: createMockKv() });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_aaa',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${activityId}/meta`) {
        return null;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        env,
        headers: { 'X-Prime-Guest-Token': 'token-1' },
        body: {
          activityId,
          channelId: activityId,
          content: 'Hello fire and forget',
        },
      }),
    );

    // Firebase write succeeded; D1 shadow-write failed silently
    expect(response.status).toBe(200);
    // Firebase set was still called
    const messageWriteCall = setSpy.mock.calls.find(([path]) =>
      typeof path === 'string' && path.startsWith(`messaging/channels/${activityId}/messages/`),
    );
    expect(messageWriteCall).toBeDefined();

    // Structured console.error must have been called with diagnostic context
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('shadow-write'),
      expect.objectContaining({
        threadId: activityId,
        channelId: activityId,
        error: 'D1 unavailable',
        failedAt: expect.any(Number),
      }),
    );
  });

  it('TC-12: Firebase write failure → 500 error response', async () => {
    const activityId = 'act-uuid-firebase-fail';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_aaa',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${activityId}/meta`) {
        return null;
      }
      return null;
    });

    // Make the Firebase `set` call for the message throw
    setSpy
      .mockResolvedValueOnce(undefined) // meta set succeeds
      .mockRejectedValueOnce(new Error('Firebase write failed'));

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        env: createMockEnv({ RATE_LIMIT: createMockKv() }),
        headers: { 'X-Prime-Guest-Token': 'token-1' },
        body: {
          activityId,
          channelId: activityId,
          content: 'Hello firebase fail',
        },
      }),
    );

    expect(response.status).toBe(500);
  });

  it('TC-06 extended: shadow-writes canonical D1 thread, message, admission, and projection rows', async () => {
    const activityId = 'act-uuid-d1-shadow';
    const senderUuid = 'occ_aaa';
    const { db, statements } = createMockD1Database();
    const env = createMockEnv({ PRIME_MESSAGING_DB: db, RATE_LIMIT: createMockKv() });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: senderUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${activityId}/meta`) {
        return null;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/activity-message',
        method: 'POST',
        env,
        headers: { 'X-Prime-Guest-Token': 'token-1' },
        body: {
          activityId,
          channelId: activityId,
          content: 'Hello D1',
        },
      }),
    );

    const payload = await response.json() as { success: boolean; messageId: string };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);

    const threadLookupQuery = normalizeD1Query('SELECT * FROM message_threads WHERE id = ?');
    const threadUpsert = statements.find((statement) =>
      statement.query.includes('INSERT INTO message_threads')
      && statement.query.includes('ON CONFLICT(id) DO UPDATE SET'),
    );
    const messageInsert = statements.find((statement) =>
      statement.query.includes('INSERT INTO message_records'),
    );
    const admissionInsert = statements.find((statement) =>
      statement.query.includes('INSERT INTO message_admissions'),
    );
    const projectionInsert = statements.find((statement) =>
      statement.query.includes('INSERT INTO message_projection_jobs'),
    );

    expect(statements[0]).toEqual(expect.objectContaining({
      query: threadLookupQuery,
      binds: [activityId],
    }));

    // Thread upserted with activity channel_type and sentinel booking_id
    expect(threadUpsert?.binds[0]).toBe(activityId);
    expect(threadUpsert?.binds[1]).toBe('activity'); // bookingId sentinel
    expect(threadUpsert?.binds[2]).toBe('activity'); // channel_type

    expect(messageInsert?.binds[0]).toBe(payload.messageId);
    expect(messageInsert?.binds[1]).toBe(activityId);

    expect(admissionInsert?.binds[0]).toBe(activityId);
    expect(admissionInsert?.binds[2]).toBe('queued');
    expect(admissionInsert?.binds[4]).toBe('guest_activity_message');

    expect(projectionInsert?.binds[2]).toBe('message');
    expect(projectionInsert?.binds[3]).toBe(payload.messageId);

    // TC-EDGE-01: successful D1 shadow-write must NOT emit console.error
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
