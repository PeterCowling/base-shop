/**
 * @jest-environment node
 */

import { onRequestGet, onRequestPost } from '../api/check-in-code';
import { FirebaseRest } from '../lib/firebase-rest';

import { createPagesContext } from './helpers';

describe('/api/check-in-code', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
  const setSpy = jest.spyOn(FirebaseRest.prototype, 'set');
  const authHeaders = {
    Authorization: 'Bearer token-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
  });

  it('TC-01: rejects invalid checkout date with 400 (fail closed)', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_1234567890123',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/check-in-code',
        method: 'POST',
        headers: authHeaders,
        body: {
          uuid: 'occ_1234567890123',
          checkOutDate: 'not-a-date',
        },
      }),
    );

    const payload = await response.json() as { error: string };
    expect(response.status).toBe(400);
    expect(payload.error).toContain('checkOutDate');
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('TC-02: treats non-finite stored expiry as expired on read', async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === 'guestSessionsByToken/token-1') {
        return {
          bookingId: 'BOOK123',
          guestUuid: 'occ_1234567890123',
          createdAt: '2026-02-01T00:00:00.000Z',
          expiresAt: '2099-02-01T00:00:00.000Z',
        };
      }
      if (path === 'checkInCodes/byUuid/occ_1234567890123') {
        return {
          code: 'BRK-ABCDE',
          uuid: 'occ_1234567890123',
          createdAt: Date.now(),
          expiresAt: Number.NaN,
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/check-in-code?uuid=occ_1234567890123',
        headers: authHeaders,
      }),
    );

    const payload = await response.json() as { code: string | null; expired?: boolean };
    expect(response.status).toBe(200);
    expect(payload.code).toBeNull();
    expect(payload.expired).toBe(true);
  });
});
