/**
 * @jest-environment node
 */

import type { RawDayData } from '../../../src/lib/owner/kpiAggregator';
import { FirebaseRest } from '../firebase-rest';
import { enumerateGuestsByDate,projectGuestKpiData } from '../kpi-projection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFirebase(): FirebaseRest {
  return new FirebaseRest({
    CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
    CF_FIREBASE_API_KEY: 'test-api-key',
  });
}

// ---------------------------------------------------------------------------
// TC-01: guest with all 6 roots populated → correct RawDayData shape
// ---------------------------------------------------------------------------

describe('projectGuestKpiData', () => {
  let getSpy: jest.SpyInstance;

  beforeEach(() => {
    getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  test('TC-01: fully populated guest produces correct RawDayData shape', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';
    const uuid = 'occ1';
    const bookingRef = 'BOOK123';

    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${bookingRef}/${uuid}`) {
        return { checkInDate: date, checkOutDate: '2026-03-03', leadGuest: true, roomNumbers: ['102'] };
      }
      if (path === `checkInCodes/byUuid/${uuid}`) {
        return { code: 'BRK-A7K9M', uuid, createdAt: 1000, expiresAt: 9999 };
      }
      if (path === `checkins/${date}/${uuid}`) {
        return { timestamp: '2026-03-01T16:30:00.000Z' };
      }
      if (path === `preArrival/${uuid}`) {
        return {
          checklistProgress: {
            routePlanned: true,
            etaConfirmed: true,
            cashPrepared: false,
            rulesReviewed: true,
            locationSaved: false,
          },
          etaConfirmedAt: 1740000000000,
        };
      }
      if (path === `primeRequests/byGuest/${uuid}`) {
        return { 'req_ext_001': true, 'req_bag_001': true };
      }
      if (path === 'primeRequests/byId/req_ext_001') {
        return { requestId: 'req_ext_001', type: 'extension', status: 'pending', bookingId: bookingRef, guestUuid: uuid, guestName: 'Test', submittedAt: 1000, updatedAt: 1000 };
      }
      if (path === 'primeRequests/byId/req_bag_001') {
        return { requestId: 'req_bag_001', type: 'bag_drop', status: 'pending', bookingId: bookingRef, guestUuid: uuid, guestName: 'Test', submittedAt: 1000, updatedAt: 1000 };
      }
      if (path === `bagStorage/${uuid}`) {
        return { requestId: 'bag_store_001', status: 'stored' };
      }
      return null;
    });

    const result: RawDayData = await projectGuestKpiData(
      date,
      [{ uuid, bookingRef }],
      firebase,
    );

    // Booking-level fields
    expect(result.bookings).toHaveProperty(bookingRef);
    const booking = result.bookings[bookingRef];
    expect(booking).toBeDefined();
    expect(booking.checkInDate).toBe(date);
    expect(booking.checkInCode).toBe('BRK-A7K9M');
    // checkInAt should be ms from the ISO timestamp
    expect(booking.checkInAt).toBe(new Date('2026-03-01T16:30:00.000Z').getTime());

    // Occupant fields
    const occupant = booking.occupants?.[uuid];
    expect(occupant).toBeDefined();
    expect(occupant?.preArrival?.etaConfirmedAt).toBe(1740000000000);
    expect(occupant?.preArrival?.checklistProgress?.routePlanned).toBe(true);

    // Extension and bag-drop requests
    expect(occupant?.extensionRequests).toBeDefined();
    expect(Object.keys(occupant?.extensionRequests ?? {})).toHaveLength(1);
    expect(occupant?.extensionRequests?.['req_ext_001']).toBe(true);

    expect(occupant?.bagDropRequests).toBeDefined();
    expect(Object.keys(occupant?.bagDropRequests ?? {})).toHaveLength(1);
    expect(occupant?.bagDropRequests?.['req_bag_001']).toBe(true);
  });

  // -------------------------------------------------------------------------
  // TC-02: missing preArrival → zero readiness, zero ETA, no throw
  // -------------------------------------------------------------------------

  test('TC-02: missing preArrival → null preArrival on occupant, no throw', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';
    const uuid = 'occ2';
    const bookingRef = 'BOOK456';

    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${bookingRef}/${uuid}`) {
        return { checkInDate: date, checkOutDate: '2026-03-02', leadGuest: true, roomNumbers: ['103'] };
      }
      // All other paths return null
      return null;
    });

    const result: RawDayData = await projectGuestKpiData(
      date,
      [{ uuid, bookingRef }],
      firebase,
    );

    expect(result.bookings).toHaveProperty(bookingRef);
    const occupant = result.bookings[bookingRef].occupants?.[uuid];
    expect(occupant).toBeDefined();
    expect(occupant?.preArrival).toBeNull();
    expect(occupant?.extensionRequests).toEqual({});
    expect(occupant?.bagDropRequests).toEqual({});
  });

  // -------------------------------------------------------------------------
  // TC-03: no primeRequests → zero extension and bag-drop counts
  // -------------------------------------------------------------------------

  test('TC-03: no primeRequests → extensionRequests and bagDropRequests are empty objects', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';
    const uuid = 'occ3';
    const bookingRef = 'BOOK789';

    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${bookingRef}/${uuid}`) {
        return { checkInDate: date, checkOutDate: '2026-03-03', leadGuest: false, roomNumbers: [] };
      }
      if (path === `preArrival/${uuid}`) {
        return { checklistProgress: { routePlanned: false, etaConfirmed: false, cashPrepared: false, rulesReviewed: false, locationSaved: false }, etaConfirmedAt: null };
      }
      if (path === `primeRequests/byGuest/${uuid}`) {
        return null;
      }
      return null;
    });

    const result: RawDayData = await projectGuestKpiData(
      date,
      [{ uuid, bookingRef }],
      firebase,
    );

    const occupant = result.bookings[bookingRef].occupants?.[uuid];
    expect(occupant?.extensionRequests).toEqual({});
    expect(occupant?.bagDropRequests).toEqual({});
  });

  // -------------------------------------------------------------------------
  // TC-04: primeRequests with multiple types → only extension and bag_drop counted
  // -------------------------------------------------------------------------

  test('TC-04: primeRequests with mixed types → only extension and bag_drop counted separately', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';
    const uuid = 'occ4';
    const bookingRef = 'BOOK_MIXED';

    getSpy.mockImplementation(async (path: string) => {
      if (path === `bookings/${bookingRef}/${uuid}`) {
        return { checkInDate: date, checkOutDate: '2026-03-02', leadGuest: true, roomNumbers: ['101'] };
      }
      if (path === `primeRequests/byGuest/${uuid}`) {
        return { 'req_ext_001': true, 'req_meal_001': true };
      }
      if (path === 'primeRequests/byId/req_ext_001') {
        return { requestId: 'req_ext_001', type: 'extension', status: 'pending', bookingId: bookingRef, guestUuid: uuid, guestName: 'Test', submittedAt: 1000, updatedAt: 1000 };
      }
      if (path === 'primeRequests/byId/req_meal_001') {
        return { requestId: 'req_meal_001', type: 'meal_change_exception', status: 'pending', bookingId: bookingRef, guestUuid: uuid, guestName: 'Test', submittedAt: 1000, updatedAt: 1000 };
      }
      return null;
    });

    const result: RawDayData = await projectGuestKpiData(
      date,
      [{ uuid, bookingRef }],
      firebase,
    );

    const occupant = result.bookings[bookingRef].occupants?.[uuid];
    // Only extension counted; meal_change_exception is ignored
    expect(occupant?.extensionRequests).toEqual({ 'req_ext_001': true });
    expect(occupant?.bagDropRequests).toEqual({});
  });

  // -------------------------------------------------------------------------
  // TC-05: in fallback path, occupantIndex miss → UUID skipped
  // -------------------------------------------------------------------------

  test('TC-05: occupantIndex miss in fallback → UUID not included in result', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';
    const uuid = 'occ5_missing';

    getSpy.mockImplementation(async (path: string) => {
      if (path === `occupantIndex/${uuid}`) {
        return null; // miss
      }
      return null;
    });

    // When bookingRef is empty string, the projection shim must use occupantIndex
    // This simulates the fallback enumeration path where bookingRef was not pre-resolved
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result: RawDayData = await projectGuestKpiData(
      date,
      [{ uuid, bookingRef: '' }], // empty bookingRef signals fallback path
      firebase,
    );

    expect(result.bookings).toEqual({});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(uuid),
      expect.anything()
    );

    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// enumerateGuestsByDate tests
// ---------------------------------------------------------------------------

describe('enumerateGuestsByDate', () => {
  let getSpy: jest.SpyInstance;

  beforeEach(() => {
    getSpy = jest.spyOn(FirebaseRest.prototype, 'get');
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  test('primary path: returns guests with bookingRefs from roomsByDate', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';

    getSpy.mockImplementation(async (path: string) => {
      if (path === `roomsByDate/${date}`) {
        return {
          'room_101': {
            'BOOK123': { guestIds: ['occ1', 'occ2'] },
          },
          'room_102': {
            'BOOK456': { guestIds: ['occ3'] },
          },
        };
      }
      return null;
    });

    const { entries, enumerationPath } = await enumerateGuestsByDate(date, firebase);

    expect(enumerationPath).toBe('primary');
    expect(entries).toHaveLength(3);
    expect(entries).toContainEqual({ uuid: 'occ1', bookingRef: 'BOOK123' });
    expect(entries).toContainEqual({ uuid: 'occ2', bookingRef: 'BOOK123' });
    expect(entries).toContainEqual({ uuid: 'occ3', bookingRef: 'BOOK456' });
  });

  test('fallback path: uses bookings scan when roomsByDate is empty', async () => {
    const firebase = makeFirebase();
    const date = '2026-03-01';

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    getSpy.mockImplementation(async (path: string) => {
      if (path === `roomsByDate/${date}`) {
        return null; // empty — triggers fallback
      }
      if (path === 'bookings') {
        return {
          'BOOK123': {
            'occ1': { checkInDate: date, checkOutDate: '2026-03-03', leadGuest: true, roomNumbers: ['101'] },
            'occ2': { checkInDate: '2026-02-20', checkOutDate: '2026-02-22', leadGuest: false, roomNumbers: ['101'] },
          },
          'BOOK456': {
            'occ3': { checkInDate: date, checkOutDate: '2026-03-02', leadGuest: true, roomNumbers: ['102'] },
          },
        };
      }
      return null;
    });

    const { entries, enumerationPath } = await enumerateGuestsByDate(date, firebase);

    warnSpy.mockRestore();

    expect(enumerationPath).toBe('fallback');
    expect(entries).toHaveLength(2); // only occ1 and occ3 match the date
    expect(entries).toContainEqual({ uuid: 'occ1', bookingRef: 'BOOK123' });
    expect(entries).toContainEqual({ uuid: 'occ3', bookingRef: 'BOOK456' });
  });
});
