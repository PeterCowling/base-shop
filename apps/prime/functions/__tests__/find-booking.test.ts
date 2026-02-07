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

  it('TC-01: returns redirectUrl for a valid surname + booking reference lookup', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });
    const token = 'existing-token';

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'bookings') {
        return {
          BOOK123: {
            guestName: 'Jane Doe',
            bookingRef: 'BDC-123456',
            checkInCode: 'BRK-ABCDE',
            guestPortalToken: token,
          },
        };
      }
      if (path === `guestSessionsByToken/${token}`) {
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
        url: 'https://prime.example.com/api/find-booking?surname=Doe&bookingRef=BDC-123456',
        headers: { 'CF-Connecting-IP': '10.0.0.1' },
        env,
      }),
    );

    const payload = await response.json() as { redirectUrl: string };

    expect(response.status).toBe(200);
    expect(payload.redirectUrl).toBe(`/g/${token}`);
    expect(kv.delete).toHaveBeenCalledWith('find-booking:10.0.0.1');
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('TC-02: returns 404 when surname does not match booking', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'bookings') {
        return {
          BOOK123: {
            guestName: 'Jane Doe',
            bookingRef: 'BDC-123456',
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/find-booking?surname=Smith&bookingRef=BDC-123456',
        headers: { 'CF-Connecting-IP': '10.0.0.2' },
        env,
      }),
    );

    const payload = await response.json() as { error: string };

    expect(response.status).toBe(404);
    expect(payload.error).toBe('Booking not found');
    expect(kv.put).toHaveBeenCalledWith(
      'find-booking:10.0.0.2',
      '1',
      { expirationTtl: 3600 },
    );
  });

  it('TC-03: returns 429 when lookup attempts exceed budget', async () => {
    const kv = createMockKv({ 'find-booking:10.0.0.3': '5' });
    const env = createMockEnv({ RATE_LIMIT: kv });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/find-booking?surname=Doe&bookingRef=BDC-123456',
        headers: { 'CF-Connecting-IP': '10.0.0.3' },
        env,
      }),
    );

    expect(response.status).toBe(429);
    expect(getSpy).not.toHaveBeenCalled();
  });
});
