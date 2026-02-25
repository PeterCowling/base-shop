/**
 * @jest-environment node
 */

import { onRequestPost } from '../api/direct-message';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

describe('/api/direct-message', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
  const updateSpy = jest.spyOn(FirebaseRest.prototype, 'update');

  beforeEach(() => {
    jest.clearAllMocks();
    setSpy.mockResolvedValue(undefined);
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('TC-01: confirmed same-booking guests can send direct message and create channel metadata', async () => {
    const bookingId = 'BOOK123';
    const senderUuid = 'occ_aaa';
    const peerUuid = 'occ_bbb';
    const channelId = 'dm_occ_aaa_occ_bbb';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid: senderUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `bookings/${bookingId}/${senderUuid}`) {
        return { firstName: 'Jane' };
      }
      if (path === `bookings/${bookingId}/${peerUuid}`) {
        return { firstName: 'Alex' };
      }
      if (path === `guestProfiles/${senderUuid}`) {
        return {
          bookingId,
          profileStatus: 'complete',
          intent: 'mixed',
          interests: [],
          stayGoals: [],
          pace: 'relaxed',
          socialOptIn: true,
          chatOptIn: true,
          blockedUsers: [],
          createdAt: 1,
          updatedAt: 1,
        };
      }
      if (path === `guestProfiles/${peerUuid}`) {
        return {
          bookingId,
          profileStatus: 'complete',
          intent: 'social',
          interests: [],
          stayGoals: [],
          pace: 'active',
          socialOptIn: true,
          chatOptIn: true,
          blockedUsers: [],
          createdAt: 1,
          updatedAt: 1,
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return null;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
        body: {
          bookingId,
          peerUuid,
          channelId,
          content: 'Hello from backend',
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

    expect(setSpy).toHaveBeenCalledWith(
      `messaging/channels/${channelId}/meta`,
      expect.objectContaining({
        channelType: 'direct',
        bookingId,
        memberUids: {
          [senderUuid]: true,
          [peerUuid]: true,
        },
      }),
    );

    const messageWriteCall = setSpy.mock.calls.find(([path]) =>
      typeof path === 'string'
      && path.startsWith(`messaging/channels/${channelId}/messages/msg_`),
    );

    expect(messageWriteCall).toBeDefined();
    expect(messageWriteCall?.[1]).toEqual(
      expect.objectContaining({
        content: 'Hello from backend',
        senderId: senderUuid,
        senderRole: 'guest',
        senderName: 'Jane',
      }),
    );
  });

  it('TC-02: rejects when peer is not a confirmed guest in the same booking', async () => {
    const bookingId = 'BOOK123';
    const senderUuid = 'occ_aaa';
    const peerUuid = 'occ_bbb';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid: senderUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `bookings/${bookingId}/${senderUuid}`) {
        return { firstName: 'Jane' };
      }
      if (path === `bookings/${bookingId}/${peerUuid}`) {
        return null;
      }
      if (path === `guestProfiles/${senderUuid}`) {
        return {
          bookingId,
          profileStatus: 'complete',
          intent: 'mixed',
          interests: [],
          stayGoals: [],
          pace: 'relaxed',
          socialOptIn: true,
          chatOptIn: true,
          blockedUsers: [],
          createdAt: 1,
          updatedAt: 1,
        };
      }
      if (path === `guestProfiles/${peerUuid}`) {
        return {
          bookingId,
          profileStatus: 'complete',
          intent: 'social',
          interests: [],
          stayGoals: [],
          pace: 'active',
          socialOptIn: true,
          chatOptIn: true,
          blockedUsers: [],
          createdAt: 1,
          updatedAt: 1,
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
        body: {
          bookingId,
          peerUuid,
          channelId: 'dm_occ_aaa_occ_bbb',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('TC-03: rejects when channelId does not match sender/peer deterministic pair', async () => {
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
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': 'BOOK123',
        },
        body: {
          bookingId: 'BOOK123',
          peerUuid: 'occ_bbb',
          channelId: 'dm_wrong',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('TC-04: rejects requests without X-Prime-Guest-Token header', async () => {
    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        body: {
          bookingId: 'BOOK123',
          peerUuid: 'occ_bbb',
          channelId: 'dm_occ_aaa_occ_bbb',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(getSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('TC-05: rejects when booking header does not match authenticated session booking', async () => {
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
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': 'BOOK999',
        },
        body: {
          bookingId: 'BOOK123',
          peerUuid: 'occ_bbb',
          channelId: 'dm_occ_aaa_occ_bbb',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('TC-06: returns 429 when write rate limit is exceeded', async () => {
    const kv = createMockKv({ 'direct-message:write:occ_aaa': '40' });
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
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        env,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': 'BOOK123',
        },
        body: {
          bookingId: 'BOOK123',
          peerUuid: 'occ_bbb',
          channelId: 'dm_occ_aaa_occ_bbb',
          content: 'Hello',
        },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('40');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('RateLimit-Limit')).toBe('40');
    expect(response.headers.get('RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('RateLimit-Reset')).toBe('60');
    expect(response.headers.get('X-RateLimit-Reset')).toMatch(/^\d+$/);
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
    expect(kv.put).toHaveBeenCalledWith(
      expect.stringMatching(/^direct-telemetry:write\.rate_limited:\d{4}-\d{2}-\d{2}$/),
      '1',
      expect.objectContaining({ expirationTtl: 35 * 24 * 60 * 60 }),
    );
  });

  it('TC-07: records write.success telemetry on successful direct message', async () => {
    const bookingId = 'BOOK123';
    const senderUuid = 'occ_aaa';
    const peerUuid = 'occ_bbb';
    const channelId = 'dm_occ_aaa_occ_bbb';
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId,
          guestUuid: senderUuid,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === `bookings/${bookingId}/${senderUuid}`) {
        return { firstName: 'Jane' };
      }
      if (path === `bookings/${bookingId}/${peerUuid}`) {
        return { firstName: 'Alex' };
      }
      if (path === `guestProfiles/${senderUuid}`) {
        return {
          bookingId,
          profileStatus: 'complete',
          intent: 'mixed',
          interests: [],
          stayGoals: [],
          pace: 'relaxed',
          socialOptIn: true,
          chatOptIn: true,
          blockedUsers: [],
          createdAt: 1,
          updatedAt: 1,
        };
      }
      if (path === `guestProfiles/${peerUuid}`) {
        return {
          bookingId,
          profileStatus: 'complete',
          intent: 'social',
          interests: [],
          stayGoals: [],
          pace: 'active',
          socialOptIn: true,
          chatOptIn: true,
          blockedUsers: [],
          createdAt: 1,
          updatedAt: 1,
        };
      }
      if (path === `messaging/channels/${channelId}/meta`) {
        return null;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/direct-message',
        method: 'POST',
        env,
        headers: {
          'X-Prime-Guest-Token': 'token-1',
          'X-Prime-Guest-Booking-Id': bookingId,
        },
        body: {
          bookingId,
          peerUuid,
          channelId,
          content: 'Hello from backend',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(kv.put).toHaveBeenCalledWith(
      expect.stringMatching(/^direct-telemetry:write\.success:\d{4}-\d{2}-\d{2}$/),
      '1',
      expect.objectContaining({ expirationTtl: 35 * 24 * 60 * 60 }),
    );
  });
});
