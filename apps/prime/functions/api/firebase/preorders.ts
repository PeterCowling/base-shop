/**
 * CF Pages Function: /api/firebase/preorders
 *
 * Server-mediated meal order operations for Prime guests.
 * Data path: preorder/{guestUuid}/{nightKey}
 */

import { errorResponse, FirebaseRest, jsonResponse } from '../../lib/firebase-rest';
import { validateGuestSessionToken } from '../../lib/guest-session';
import { buildPrimeRequestId, createPrimeRequestRecord, createPrimeRequestWritePayload } from '../../lib/prime-requests';

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key.trim() === name) {
      return rest.join('=').trim() || null;
    }
  }
  return null;
}

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface PreorderNight {
  night: string;
  breakfast: string;
  drink1: string;
  drink2: string;
  serviceDate?: string;
}

interface PreorderRequestBody {
  token?: string;
  service?: 'breakfast' | 'drink';
  serviceDate?: string;
  value?: string;
  requestChangeException?: boolean;
}

interface BookingOccupantRecord {
  firstName?: string;
  lastName?: string;
}

function todayInRome(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function findNightKeyForServiceDate(
  preorders: Record<string, PreorderNight>,
  serviceDate: string,
): string | null {
  const direct = Object.entries(preorders).find(([, night]) => night.serviceDate === serviceDate);
  if (direct) {
    return direct[0];
  }

  const alias = Object.entries(preorders).find(([, night]) => night.night === serviceDate);
  if (alias) {
    return alias[0];
  }

  return null;
}

function hasServiceEntitlement(
  preorders: Record<string, PreorderNight>,
  service: 'breakfast' | 'drink',
): boolean {
  const nights = Object.values(preorders);
  if (nights.length === 0) {
    return true;
  }

  if (service === 'breakfast') {
    return nights.some((night) => night.breakfast && night.breakfast !== 'NA');
  }
  return nights.some(
    (night) =>
      (night.drink1 && night.drink1 !== 'NA') ||
      (night.drink2 && night.drink2 !== 'NA'),
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = parseCookie(request.headers.get('Cookie') ?? '', 'prime_session')
    ?? url.searchParams.get('token');

  try {
    const authResult = await validateGuestSessionToken(token, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    if (!authResult.session.guestUuid) {
      return errorResponse('guestUuid missing for session', 422); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const firebase = new FirebaseRest(env);
    const preorder = await firebase.get<Record<string, PreorderNight>>(
      `preorder/${authResult.session.guestUuid}`,
    );

    return jsonResponse({ preorder: preorder ?? {} });
  } catch (error) {
    console.error('Error fetching preorder:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to fetch preorder', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: PreorderRequestBody;
  try {
    body = await request.json() as PreorderRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const service = body.service;
  const serviceDate = (body.serviceDate ?? '').trim();
  const value = (body.value ?? '').trim();
  const requestChangeException = body.requestChangeException === true;

  if (!service || (service !== 'breakfast' && service !== 'drink')) {
    return errorResponse('service must be breakfast or drink', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (!serviceDate || !isIsoDate(serviceDate)) {
    return errorResponse('serviceDate must be ISO YYYY-MM-DD', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (!value) {
    return errorResponse('value is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    const sessionToken = parseCookie(request.headers.get('Cookie') ?? '', 'prime_session') ?? body.token ?? null;
    const authResult = await validateGuestSessionToken(sessionToken, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const guestUuid = authResult.session.guestUuid;
    if (!guestUuid) {
      return errorResponse('guestUuid missing for session', 422); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const firebase = new FirebaseRest(env);
    const preorders = (await firebase.get<Record<string, PreorderNight>>(`preorder/${guestUuid}`)) ?? {};

    if (!hasServiceEntitlement(preorders, service)) {
      return errorResponse('This booking is not eligible for that service', 403); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const today = todayInRome();
    const existingNightKey = findNightKeyForServiceDate(preorders, serviceDate);
    const isEditingExisting = Boolean(existingNightKey);
    const isSameDayOrPast = serviceDate <= today;

    if (isEditingExisting && isSameDayOrPast) {
      if (!requestChangeException) {
        return errorResponse('Same-day order changes are not allowed', 409); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      }

      const occupant = await firebase.get<BookingOccupantRecord>(
        `bookings/${authResult.session.bookingId}/${guestUuid}`,
      );
      const guestName = `${occupant?.firstName ?? ''} ${occupant?.lastName ?? ''}`.trim() || 'Guest';
      const requestId = buildPrimeRequestId('meal_change_exception');
      const requestRecord = createPrimeRequestRecord({
        requestId,
        type: 'meal_change_exception',
        bookingId: authResult.session.bookingId,
        guestUuid,
        guestName,
        payload: {
          service,
          serviceDate,
          requestedValue: value,
          currentNightKey: existingNightKey,
        },
      });
      await firebase.update('/', createPrimeRequestWritePayload(requestRecord));

      return jsonResponse({
        success: false,
        policyBlocked: true,
        requestQueued: true,
        requestId,
        message: 'Same-day changes require reception approval. A request has been sent.',
      }, 202);
    }

    const nightKey = existingNightKey ?? `night${Object.keys(preorders).length + 1}`;
    const existingNight = preorders[nightKey] ?? {
      night: nightKey,
      breakfast: 'NA',
      drink1: 'NA',
      drink2: 'NA',
      serviceDate,
    };

    const nextNight: PreorderNight = {
      ...existingNight,
      night: existingNight.night || nightKey,
      serviceDate,
    };

    if (service === 'breakfast') {
      nextNight.breakfast = value;
    } else {
      nextNight.drink1 = value;
    }

    await firebase.set(`preorder/${guestUuid}/${nightKey}`, nextNight);

    return jsonResponse({
      success: true,
      nightKey,
      order: nextNight,
      updated: isEditingExisting,
    });
  } catch (error) {
    console.error('Error saving preorder:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to save preorder', 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
};
