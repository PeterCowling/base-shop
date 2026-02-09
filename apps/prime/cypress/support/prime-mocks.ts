/// <reference types="cypress" />

export const PRIME_E2E_GUEST = {
  bookingId: 'BOOK-E2E-001',
  bookingRef: 'E2EBOOK1',
  uuid: 'occ_1234567890123',
  token: 'e2e-token-1234567890',
  firstName: 'Alex',
  lastName: 'Guest',
  checkInCode: 'BRK-E2E12',
} as const;

type PrimeJourneyMode = 'pre-arrival' | 'arrival-day';

function toIsoDateWithOffset(daysFromToday: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function buildBookingDates(mode: PrimeJourneyMode): { checkInDate: string; checkOutDate: string } {
  if (mode === 'arrival-day') {
    return {
      checkInDate: toIsoDateWithOffset(0),
      checkOutDate: toIsoDateWithOffset(1),
    };
  }

  return {
    checkInDate: toIsoDateWithOffset(2),
    checkOutDate: toIsoDateWithOffset(4),
  };
}

export function installPrimeApiMocks(mode: PrimeJourneyMode = 'pre-arrival'): void {
  const { checkInDate, checkOutDate } = buildBookingDates(mode);

  cy.intercept('GET', '/api/find-booking*', {
    statusCode: 200,
    body: {
      redirectUrl: `/g/${PRIME_E2E_GUEST.token}`,
    },
  }).as('findBooking');

  cy.intercept('GET', '/api/guest-session*', (req) => {
    const token = req.query.token;

    if (typeof token === 'string' && token.includes('invalid')) {
      req.reply({ statusCode: 404, body: { error: 'Token not found' } });
      return;
    }

    if (typeof token === 'string' && token.includes('expired')) {
      req.reply({ statusCode: 410, body: { error: 'Token expired' } });
      return;
    }

    req.reply({ statusCode: 200, body: { status: 'ok', expiresAt: '2099-01-01T00:00:00.000Z' } });
  }).as('validateGuestSession');

  cy.intercept('POST', '/api/guest-session', {
    statusCode: 200,
    body: {
      bookingId: PRIME_E2E_GUEST.bookingId,
      guestUuid: PRIME_E2E_GUEST.uuid,
      guestFirstName: PRIME_E2E_GUEST.firstName,
    },
  }).as('verifyGuestSession');

  cy.intercept('POST', '/api/check-in-code', {
    statusCode: 200,
    body: {
      code: PRIME_E2E_GUEST.checkInCode,
    },
  }).as('generateCheckInCode');

  cy.intercept('GET', /https:\/\/.*firebasedatabase\.app\/.*\.json.*/, (req) => {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\//, '').replace(/\.json$/, '');

    if (path === `occupantIndex/${PRIME_E2E_GUEST.uuid}`) {
      req.reply({ statusCode: 200, body: PRIME_E2E_GUEST.bookingRef });
      return;
    }

    if (path === `bookings/${PRIME_E2E_GUEST.bookingRef}/${PRIME_E2E_GUEST.uuid}`) {
      req.reply({
        statusCode: 200,
        body: {
          checkInDate,
          checkOutDate,
          leadGuest: true,
          roomNumbers: ['A1'],
        },
      });
      return;
    }

    if (path === `guestByRoom/${PRIME_E2E_GUEST.uuid}`) {
      req.reply({
        statusCode: 200,
        body: {
          allocated: 'A1',
          booked: 'A1',
        },
      });
      return;
    }

    if (path === `guestsDetails/${PRIME_E2E_GUEST.bookingRef}/${PRIME_E2E_GUEST.uuid}`) {
      req.reply({
        statusCode: 200,
        body: {
          firstName: PRIME_E2E_GUEST.firstName,
          lastName: PRIME_E2E_GUEST.lastName,
          language: 'en',
        },
      });
      return;
    }

    if (path === `completedTasks/${PRIME_E2E_GUEST.uuid}`) {
      req.reply({ statusCode: 200, body: {} });
      return;
    }

    if (path === `checkInCodes/byUuid/${PRIME_E2E_GUEST.uuid}`) {
      req.reply({
        statusCode: 200,
        body: {
          code: PRIME_E2E_GUEST.checkInCode,
          uuid: PRIME_E2E_GUEST.uuid,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        },
      });
      return;
    }

    if (path.startsWith('loans/') || path.startsWith('financialsRoom/') || path.startsWith('cityTax/') || path.startsWith('bagStorage/')) {
      req.reply({ statusCode: 200, body: null });
      return;
    }

    if (path.startsWith('preorder/')) {
      req.reply({ statusCode: 200, body: {} });
      return;
    }

    if (path.startsWith('preArrival/')) {
      req.reply({ statusCode: 200, body: null });
      return;
    }

    req.reply({ statusCode: 200, body: null });
  }).as('firebaseReads');
}

export function setPrimeGuestSession(overrides?: Partial<{
  token: string;
  bookingId: string;
  uuid: string;
  firstName: string;
}>): void {
  const token = overrides?.token ?? PRIME_E2E_GUEST.token;
  const bookingId = overrides?.bookingId ?? PRIME_E2E_GUEST.bookingId;
  const uuid = overrides?.uuid ?? PRIME_E2E_GUEST.uuid;
  const firstName = overrides?.firstName ?? PRIME_E2E_GUEST.firstName;

  cy.window().then((win) => {
    win.localStorage.setItem('prime_guest_token', token);
    win.localStorage.setItem('prime_guest_booking_id', bookingId);
    win.localStorage.setItem('prime_guest_uuid', uuid);
    win.localStorage.setItem('prime_guest_first_name', firstName);
    win.localStorage.setItem('prime_guest_verified_at', new Date().toISOString());
  });
}
