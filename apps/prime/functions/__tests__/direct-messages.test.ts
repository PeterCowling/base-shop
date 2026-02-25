/**
 * @jest-environment node
 */

import { onRequestGet } from '../api/direct-messages';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

describe('/api/direct-messages', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  it('TC-01: confirmed direct-channel member can read sorted message history', async () => {
    const bookingId = 'BOOK123';
    const guestUuid = 'occ_aaa';
    const channelId = 'dm_occ_aaa_occ_bbb';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return {
          bookingId,
          channelType: 'direct',
          memberUids: {
            occ_aaa: true,
            occ_bbb: true,
          },
        };
      }
      if (path === `messaging/channels/${channelId}/messages`) {
        return {
          msg_2: {
            content: 'Second',
            senderId: 'occ_bbb',
            senderRole: 'guest',
            createdAt: 200,
          },
          msg_1: {
            content: 'First',
            senderId: 'occ_aaa',
            senderRole: 'guest',
            createdAt: 100,
          },
          msg_invalid: {
            content: 'Bad',
            senderId: 'occ_aaa',
            createdAt: 300,
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/direct-messages?channelId=${channelId}`,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
      }),
    );

    const payload = await response.json() as {
      messages: Array<{ id: string; createdAt: number }>;
    };

    expect(response.status).toBe(200);
    expect(payload.messages).toEqual([
      expect.objectContaining({ id: 'msg_1', createdAt: 100 }),
      expect.objectContaining({ id: 'msg_2', createdAt: 200 }),
    ]);
  });

  it('TC-02: rejects requests when booking header does not match token session', async () => {
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

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-messages?channelId=dm_occ_aaa_occ_bbb',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': 'BOOK999',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it('TC-03: rejects reads when channel metadata does not confirm direct membership', async () => {
    const bookingId = 'BOOK123';
    const guestUuid = 'occ_aaa';
    const channelId = 'dm_occ_aaa_occ_bbb';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return {
          bookingId,
          channelType: 'direct',
          memberUids: {
            occ_bbb: true,
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/direct-messages?channelId=${channelId}`,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(getSpy).not.toHaveBeenCalledWith(`messaging/channels/${channelId}/messages`);
  });

  it('TC-04: returns empty list when direct channel metadata does not exist', async () => {
    const bookingId = 'BOOK123';
    const channelId = 'dm_occ_aaa_occ_bbb';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid: 'occ_aaa',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return null;
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/direct-messages?channelId=${channelId}`,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
      }),
    );

    const payload = await response.json() as { messages: unknown[] };
    expect(response.status).toBe(200);
    expect(payload.messages).toEqual([]);
  });

  it('TC-05: applies before cursor and limit when returning messages', async () => {
    const bookingId = 'BOOK123';
    const guestUuid = 'occ_aaa';
    const channelId = 'dm_occ_aaa_occ_bbb';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return {
          bookingId,
          channelType: 'direct',
          memberUids: {
            occ_aaa: true,
            occ_bbb: true,
          },
        };
      }
      if (path === `messaging/channels/${channelId}/messages`) {
        return {
          msg_1: {
            content: 'First',
            senderId: 'occ_aaa',
            senderRole: 'guest',
            createdAt: 100,
          },
          msg_2: {
            content: 'Second',
            senderId: 'occ_bbb',
            senderRole: 'guest',
            createdAt: 200,
          },
          msg_3: {
            content: 'Third',
            senderId: 'occ_aaa',
            senderRole: 'guest',
            createdAt: 300,
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/direct-messages?channelId=${channelId}&before=250&limit=1`,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
      }),
    );

    const payload = await response.json() as {
      messages: Array<{ id: string; createdAt: number }>;
    };
    expect(response.status).toBe(200);
    expect(payload.messages).toEqual([
      expect.objectContaining({ id: 'msg_2', createdAt: 200 }),
    ]);
  });

  it('TC-06: rejects invalid limit parameter', async () => {
    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-messages?channelId=dm_occ_aaa_occ_bbb&limit=0',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('TC-07: rejects invalid before parameter', async () => {
    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-messages?channelId=dm_occ_aaa_occ_bbb&before=nope',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('TC-08: returns 429 when read rate limit is exceeded', async () => {
    const kv = createMockKv({ 'direct-message:read:occ_aaa': '180' });
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

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-messages?channelId=dm_occ_aaa_occ_bbb',
        env,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': 'BOOK123',
        },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('180');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('RateLimit-Limit')).toBe('180');
    expect(response.headers.get('RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('RateLimit-Reset')).toBe('60');
    expect(response.headers.get('X-RateLimit-Reset')).toMatch(/^\d+$/);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(kv.put).toHaveBeenCalledWith(
      expect.stringMatching(/^direct-telemetry:read\.rate_limited:\d{4}-\d{2}-\d{2}$/),
      '1',
      expect.objectContaining({ expirationTtl: 35 * 24 * 60 * 60 }),
    );
  });

  it('TC-09: records read.success telemetry for authorized direct reads', async () => {
    const bookingId = 'BOOK123';
    const guestUuid = 'occ_aaa';
    const channelId = 'dm_occ_aaa_occ_bbb';
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return {
          bookingId,
          channelType: 'direct',
          memberUids: {
            occ_aaa: true,
            occ_bbb: true,
          },
        };
      }
      if (path === `messaging/channels/${channelId}/messages`) {
        return {
          msg_1: {
            content: 'First',
            senderId: 'occ_aaa',
            senderRole: 'guest',
            createdAt: 100,
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/direct-messages?channelId=${channelId}`,
        env,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(kv.put).toHaveBeenCalledWith(
      expect.stringMatching(/^direct-telemetry:read\.success:\d{4}-\d{2}-\d{2}$/),
      '1',
      expect.objectContaining({ expirationTtl: 35 * 24 * 60 * 60 }),
    );
  });
});
