/**
 * @jest-environment node
 */

import { onRequestGet, onRequestPost } from '../api/guest-session';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

describe('/api/guest-session', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  it('TC-04: GET returns 200 for valid non-expired token', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/valid-token') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_1234567890123',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-12-31T00:00:00.000Z',
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/guest-session?token=valid-token',
      }),
    );
    const payload = await response.json() as { status: string; expiresAt: string };

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
    expect(payload.expiresAt).toBe('2099-12-31T00:00:00.000Z');
  });

  it('TC-05: GET returns 410 for expired token', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/expired-token') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_1234567890123',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2020-01-01T00:00:00.000Z',
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/guest-session?token=expired-token',
      }),
    );

    expect(response.status).toBe(410);
  });

  it('TC-06: POST returns booking data when last name verification succeeds', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/valid-token') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_1234567890123',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-12-31T00:00:00.000Z',
        };
      }
      if (path === 'bookings/BOOK123') {
        return {
          guestName: 'Jane Doe',
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/guest-session',
        method: 'POST',
        body: {
          token: 'valid-token',
          lastName: 'Doe',
        },
        headers: { 'CF-Connecting-IP': '10.0.0.10' },
        env,
      }),
    );

    const payload = await response.json() as {
      bookingId: string;
      guestUuid: string | null;
      guestFirstName: string;
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      bookingId: 'BOOK123',
      guestUuid: 'occ_1234567890123',
      guestFirstName: 'Jane',
    });
    expect(kv.delete).toHaveBeenCalledWith('guest-verify:10.0.0.10:valid-token');
  });

  it('TC-07: POST returns 403 when last name verification fails', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/valid-token') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_1234567890123',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-12-31T00:00:00.000Z',
        };
      }
      if (path === 'bookings/BOOK123') {
        return {
          guestName: 'Jane Doe',
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/guest-session',
        method: 'POST',
        body: {
          token: 'valid-token',
          lastName: 'Smith',
        },
        headers: { 'CF-Connecting-IP': '10.0.0.11' },
        env,
      }),
    );

    expect(response.status).toBe(403);
    expect(kv.put).toHaveBeenCalledWith(
      'guest-verify:10.0.0.11:valid-token',
      '1',
      { expirationTtl: 900 },
    );
  });
});
