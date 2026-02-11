/**
 * @jest-environment node
 */

import { onRequestGet } from '../api/find-booking';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

describe('/api/find-booking', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
  const updateSpy = jest.spyOn(FirebaseRest.prototype, 'update');
  const deleteSpy = jest.spyOn(FirebaseRest.prototype, 'delete');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
    updateSpy.mockRestore();
    deleteSpy.mockRestore();
  });

  // Real Firebase data shape for mocks
  const BOOKING_REF = 'IM6JF8';
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
    [OCCUPANT_ID]: {
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
    },
  };

  it('TC-01: returns redirectUrl for a valid surname + booking reference lookup', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    setSpy.mockResolvedValue(undefined);
    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${BOOKING_REF}`) {
        return mockBookingData;
      }
      if (path === `guestsDetails/${BOOKING_REF}`) {
        return mockGuestDetails;
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/find-booking?surname=Rochford&bookingRef=${BOOKING_REF}`,
        headers: { 'CF-Connecting-IP': '10.0.0.1' },
        env,
      }),
    );

    const payload = (await response.json()) as { redirectUrl: string };

    expect(response.status).toBe(200);
    expect(payload.redirectUrl).toMatch(/^\/g\/[a-f0-9]{32}$/);
    // Token was created in guestSessionsByToken
    expect(setSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^guestSessionsByToken\//),
      expect.objectContaining({
        bookingId: BOOKING_REF,
        guestUuid: OCCUPANT_ID,
      }),
    );
    // Rate limit reset on success
    expect(kv.delete).toHaveBeenCalledWith('find-booking:10.0.0.1');
    // No writes to booking node
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('TC-02: returns 404 when surname does not match booking', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${BOOKING_REF}`) {
        return mockBookingData;
      }
      if (path === `guestsDetails/${BOOKING_REF}`) {
        return mockGuestDetails;
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/find-booking?surname=Smith&bookingRef=${BOOKING_REF}`,
        headers: { 'CF-Connecting-IP': '10.0.0.2' },
        env,
      }),
    );

    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(payload.error).toBe('Booking not found');
    expect(kv.put).toHaveBeenCalledWith('find-booking:10.0.0.2', '1', {
      expirationTtl: 3600,
    });
  });

  it('TC-03: returns 429 when lookup attempts exceed budget', async () => {
    const kv = createMockKv({ 'find-booking:10.0.0.3': '5' });
    const env = createMockEnv({ RATE_LIMIT: kv });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/find-booking?surname=Doe&bookingRef=BDC-123456`,
        headers: { 'CF-Connecting-IP': '10.0.0.3' },
        env,
      }),
    );

    expect(response.status).toBe(429);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('TC-04: returns 404 when booking reference does not exist', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async () => null);

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/find-booking?surname=Doe&bookingRef=NONEXISTENT',
        headers: { 'CF-Connecting-IP': '10.0.0.4' },
        env,
      }),
    );

    expect(response.status).toBe(404);
    expect(kv.put).toHaveBeenCalledWith('find-booking:10.0.0.4', '1', {
      expirationTtl: 3600,
    });
  });

  it('TC-05: returns 404 when booking exists but no guestsDetails found', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${BOOKING_REF}`) {
        return mockBookingData;
      }
      // guestsDetails returns null
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/find-booking?surname=Rochford&bookingRef=${BOOKING_REF}`,
        headers: { 'CF-Connecting-IP': '10.0.0.5' },
        env,
      }),
    );

    expect(response.status).toBe(404);
  });

  it('TC-06: token issuance stores correct guestUuid and checkout-based expiry', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    setSpy.mockResolvedValue(undefined);
    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${BOOKING_REF}`) {
        return mockBookingData;
      }
      if (path === `guestsDetails/${BOOKING_REF}`) {
        return mockGuestDetails;
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: `https://prime.example.com/api/find-booking?surname=Rochford&bookingRef=${BOOKING_REF}`,
        headers: { 'CF-Connecting-IP': '10.0.0.6' },
        env,
      }),
    );

    expect(response.status).toBe(200);

    // Verify the token was stored with correct shape
    const setCall = setSpy.mock.calls[0];
    expect(setCall[0]).toMatch(/^guestSessionsByToken\//);

    const tokenData = setCall[1] as {
      bookingId: string;
      guestUuid: string;
      createdAt: string;
      expiresAt: string;
    };
    expect(tokenData.bookingId).toBe(BOOKING_REF);
    expect(tokenData.guestUuid).toBe(OCCUPANT_ID);
    expect(tokenData.createdAt).toBeDefined();

    // Expiry should be checkout (2026-08-17) + 48 hours
    const expiry = new Date(tokenData.expiresAt);
    const checkoutPlus48h = new Date('2026-08-17T00:00:00.000Z');
    checkoutPlus48h.setTime(checkoutPlus48h.getTime() + 48 * 60 * 60 * 1000);
    expect(expiry.toISOString()).toBe(checkoutPlus48h.toISOString());
  });
});
