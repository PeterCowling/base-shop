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

  // Real Firebase data shapes
  const BOOKING_ID = 'IM6JF8';
  const OCCUPANT_ID = 'occ_1767440561435';

  const mockBookingData = {
    [OCCUPANT_ID]: {
      checkInDate: '2026-08-15',
      checkOutDate: '2026-08-17',
      leadGuest: true,
      roomNumbers: ['6'],
    },
  };

  const mockGuestDetails = {
    firstName: 'Megan',
    lastName: 'Rochford',
    email: 'meganrochford01@gmail.com',
    gender: 'F',
    citizenship: '',
    dateOfBirth: { dd: '', mm: '', yyyy: '' },
    document: { number: '', type: 'Passport' },
    language: '',
    municipality: 'NONE',
    placeOfBirth: '',
  };

  it('TC-04: GET returns 200 for valid non-expired token', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/valid-token') {
        return {
          bookingId: BOOKING_ID,
          guestUuid: OCCUPANT_ID,
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
    const payload = (await response.json()) as { status: string; expiresAt: string };

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
    expect(payload.expiresAt).toBe('2099-12-31T00:00:00.000Z');
  });

  it('TC-05: GET returns 410 for expired token', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/expired-token') {
        return {
          bookingId: BOOKING_ID,
          guestUuid: OCCUPANT_ID,
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
          bookingId: BOOKING_ID,
          guestUuid: OCCUPANT_ID,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-12-31T00:00:00.000Z',
        };
      }
      if (path === `bookings/${BOOKING_ID}`) {
        return mockBookingData;
      }
      if (path === `guestsDetails/${BOOKING_ID}/${OCCUPANT_ID}`) {
        return mockGuestDetails;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/guest-session',
        method: 'POST',
        body: {
          token: 'valid-token',
          lastName: 'Rochford',
        },
        headers: { 'CF-Connecting-IP': '10.0.0.10' },
        env,
      }),
    );

    const payload = (await response.json()) as {
      bookingId: string;
      guestUuid: string | null;
      guestFirstName: string;
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      bookingId: BOOKING_ID,
      guestUuid: OCCUPANT_ID,
      guestFirstName: 'Megan',
    });
    expect(kv.delete).toHaveBeenCalledWith('guest-verify:10.0.0.10:valid-token');
  });

  it('TC-07: POST returns 403 when last name verification fails', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/valid-token') {
        return {
          bookingId: BOOKING_ID,
          guestUuid: OCCUPANT_ID,
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-12-31T00:00:00.000Z',
        };
      }
      if (path === `bookings/${BOOKING_ID}`) {
        return mockBookingData;
      }
      if (path === `guestsDetails/${BOOKING_ID}/${OCCUPANT_ID}`) {
        return mockGuestDetails;
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
    expect(kv.put).toHaveBeenCalledWith('guest-verify:10.0.0.11:valid-token', '1', {
      expirationTtl: 900,
    });
  });

  it('TC-08: POST with null guestUuid falls back to lead guest from booking', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/null-uuid-token') {
        return {
          bookingId: BOOKING_ID,
          guestUuid: null, // null — must resolve from booking occupants
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-12-31T00:00:00.000Z',
        };
      }
      if (path === `bookings/${BOOKING_ID}`) {
        return mockBookingData;
      }
      if (path === `guestsDetails/${BOOKING_ID}/${OCCUPANT_ID}`) {
        return mockGuestDetails;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/guest-session',
        method: 'POST',
        body: {
          token: 'null-uuid-token',
          lastName: 'Rochford',
        },
        headers: { 'CF-Connecting-IP': '10.0.0.12' },
        env,
      }),
    );

    const payload = (await response.json()) as {
      bookingId: string;
      guestUuid: string | null;
      guestFirstName: string;
    };

    expect(response.status).toBe(200);
    expect(payload.bookingId).toBe(BOOKING_ID);
    expect(payload.guestUuid).toBe(OCCUPANT_ID);
    expect(payload.guestFirstName).toBe('Megan');
  });
});
