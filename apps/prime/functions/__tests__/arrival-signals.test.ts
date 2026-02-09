/**
 * @jest-environment node
 */

import { onRequestGet } from '../api/check-in-lookup';
import { FirebaseRest } from '../lib/firebase-rest';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

describe('/api/check-in-lookup readiness signals', () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, 'get');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  it('TC-01: returns readiness + personalization fields for active arrivals', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'checkInCodes/byCode/BRK-ABCDE') {
        return {
          code: 'BRK-ABCDE',
          uuid: 'occ_1234567890123',
          createdAt: Date.now() - 1000,
          expiresAt: Date.now() + 1000 * 60 * 60,
        };
      }
      if (path === 'bookings') {
        return {
          BOOK123: {
            occupants: {
              occ_1234567890123: true,
            },
          },
        };
      }
      if (path === 'bookings/BOOK123/occ_1234567890123') {
        return {
          firstName: 'Jane',
          lastName: 'Doe',
          room: 'Room 3',
          checkInDate: '2026-02-07',
          checkOutDate: '2026-02-10',
          nights: 3,
          cityTax: { totalDue: 18 },
        };
      }
      if (path === 'preArrival/occ_1234567890123') {
        return {
          etaWindow: '18:00-18:30',
          etaMethod: 'ferry',
          routeSaved: 'sorrento-positano-ferry',
          arrivalMethodPreference: 'ferry',
          arrivalConfidence: 'confident',
          checklistProgress: {
            routePlanned: true,
            etaConfirmed: true,
            cashPrepared: false,
            rulesReviewed: true,
            locationSaved: true,
          },
        };
      }
      if (path === 'bagStorage/occ_1234567890123') {
        return {
          requestStatus: 'pending',
        };
      }

      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/check-in-lookup?code=BRK-ABCDE',
        headers: { 'CF-Connecting-IP': '10.0.0.44' },
        env,
      }),
    );

    const payload = await response.json() as {
      readiness: {
        etaConfirmed: boolean;
        cashPrepared: boolean;
        routePlanned: boolean;
        rulesReviewed: boolean;
        locationSaved: boolean;
        readinessScore: number;
      };
      personalization: {
        arrivalMethodPreference: string | null;
        arrivalConfidence: string | null;
      };
      operational: {
        bagDropRequested: boolean;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.readiness).toEqual({
      etaConfirmed: true,
      cashPrepared: false,
      routePlanned: true,
      rulesReviewed: true,
      locationSaved: true,
      readinessScore: 75,
    });
    expect(payload.personalization).toEqual({
      arrivalMethodPreference: 'ferry',
      arrivalConfidence: 'confident',
    });
    expect(payload.operational).toEqual({
      bagDropRequested: true,
    });
  });

  it('TC-02: missing preArrival node falls back to default readiness state', async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === 'checkInCodes/byCode/BRK-ABCDE') {
        return {
          code: 'BRK-ABCDE',
          uuid: 'occ_1234567890123',
          createdAt: Date.now() - 1000,
          expiresAt: Date.now() + 1000 * 60 * 60,
        };
      }
      if (path === 'bookings') {
        return {
          BOOK123: {
            occupants: {
              occ_1234567890123: true,
            },
          },
        };
      }
      if (path === 'bookings/BOOK123/occ_1234567890123') {
        return {
          firstName: 'Jane',
          lastName: 'Doe',
          room: 'Room 3',
          checkInDate: '2026-02-07',
          checkOutDate: '2026-02-10',
          nights: 3,
          cityTax: { totalDue: 18 },
        };
      }
      if (path === 'preArrival/occ_1234567890123') {
        return null;
      }

      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/check-in-lookup?code=BRK-ABCDE',
        headers: { 'CF-Connecting-IP': '10.0.0.45' },
        env,
      }),
    );

    const payload = await response.json() as { readiness: { readinessScore: number } };

    expect(response.status).toBe(200);
    expect(payload.readiness).toEqual({
      etaConfirmed: false,
      cashPrepared: false,
      routePlanned: false,
      rulesReviewed: false,
      locationSaved: false,
      readinessScore: 0,
    });
  });

  it('TC-03: malformed request without code returns 400', async () => {
    const response = await onRequestGet(
      createPagesContext({
        url: 'https://prime.example.com/api/check-in-lookup',
      }),
    );

    expect(response.status).toBe(400);
  });
});
