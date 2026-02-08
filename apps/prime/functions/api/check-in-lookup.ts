/**
 * CF Pages Function: /api/check-in-lookup
 *
 * Staff-only endpoint to look up guest details by check-in code.
 * Returns minimal data for privacy (first name + last initial only).
 *
 * GET ?code=BRK-XXXXX
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../lib/firebase-rest';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
}

interface CheckInCodeRecord {
  code: string;
  uuid: string;
  createdAt: number;
  expiresAt: number;
}

interface OccupantData {
  firstName?: string;
  lastName?: string;
  room?: string;
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
  cityTax?: { totalDue?: number };
}

interface PreArrivalData {
  etaWindow?: string | null;
  etaMethod?: string | null;
  cashReadyCityTax?: boolean;
  cashReadyDeposit?: boolean;
  routeSaved?: string | null;
  arrivalMethodPreference?: string | null;
  arrivalConfidence?: string | null;
  checklistProgress?: {
    routePlanned?: boolean;
    etaConfirmed?: boolean;
    cashPrepared?: boolean;
    rulesReviewed?: boolean;
    locationSaved?: boolean;
  };
}

interface BagStorageData {
  requestStatus?: string;
}

const KEYCARD_DEPOSIT = 10; // EUR
const MAX_LOOKUPS_PER_HOUR = 120;
const RATE_LIMIT_TTL_SECONDS = 60 * 60;
const READINESS_WEIGHTS = {
  routePlanned: 25,
  etaConfirmed: 20,
  cashPrepared: 25,
  rulesReviewed: 15,
  locationSaved: 15,
} as const;

function formatGuestName(firstName: string, lastName: string): string {
  if (!lastName) return firstName;
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

function coerceBoolean(value: unknown): boolean {
  return value === true;
}

function buildReadinessSignals(preArrival: PreArrivalData | null) {
  const checklist = preArrival?.checklistProgress ?? {};

  const etaConfirmed = coerceBoolean(checklist.etaConfirmed) || Boolean(preArrival?.etaWindow);
  const cashPrepared = coerceBoolean(checklist.cashPrepared) || (
    coerceBoolean(preArrival?.cashReadyCityTax) && coerceBoolean(preArrival?.cashReadyDeposit)
  );
  const routePlanned = coerceBoolean(checklist.routePlanned) || Boolean(preArrival?.routeSaved);
  const rulesReviewed = coerceBoolean(checklist.rulesReviewed);
  const locationSaved = coerceBoolean(checklist.locationSaved);

  const readinessScore = (
    (routePlanned ? READINESS_WEIGHTS.routePlanned : 0) +
    (etaConfirmed ? READINESS_WEIGHTS.etaConfirmed : 0) +
    (cashPrepared ? READINESS_WEIGHTS.cashPrepared : 0) +
    (rulesReviewed ? READINESS_WEIGHTS.rulesReviewed : 0) +
    (locationSaved ? READINESS_WEIGHTS.locationSaved : 0)
  );

  return {
    etaConfirmed,
    cashPrepared,
    routePlanned,
    rulesReviewed,
    locationSaved,
    readinessScore,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `check-in-lookup:${clientIP}`;

  if (env.RATE_LIMIT) {
    const attempts = await env.RATE_LIMIT.get(rateLimitKey);
    if (attempts && parseInt(attempts, 10) >= MAX_LOOKUPS_PER_HOUR) {
      return errorResponse('Too many lookup attempts. Please try again later.', 429);
    }
    const nextAttemptCount = (parseInt(attempts || '0', 10) + 1).toString();
    await env.RATE_LIMIT.put(rateLimitKey, nextAttemptCount, {
      expirationTtl: RATE_LIMIT_TTL_SECONDS,
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return errorResponse('code parameter is required', 400);
  }

  try {
    const firebase = new FirebaseRest(env);

    // Look up code record
    const codeRecord = await firebase.get<CheckInCodeRecord>(
      `checkInCodes/byCode/${code.toUpperCase()}`,
    );

    if (!codeRecord) {
      return errorResponse('Code not found', 404);
    }

    // Check if expired
    if (codeRecord.expiresAt && codeRecord.expiresAt < Date.now()) {
      return errorResponse('Code expired', 410);
    }

    const { uuid } = codeRecord;

    // Search bookings for this guest UUID
    const bookings = await firebase.get<Record<string, Record<string, unknown>>>('bookings');

    if (!bookings) {
      return errorResponse('Booking not found', 404);
    }

    // Find booking containing this occupant
    for (const [bookingCode, bookingData] of Object.entries(bookings)) {
      const occupants = bookingData.occupants as Record<string, boolean> | undefined;
      if (occupants && occupants[uuid]) {
        // Fetch occupant details
        const occupant = await firebase.get<OccupantData>(`bookings/${bookingCode}/${uuid}`);

        if (!occupant) continue;

        // Fetch pre-arrival data for ETA + readiness context
        const preArrival = await firebase.get<PreArrivalData>(`preArrival/${uuid}`);
        const readiness = buildReadinessSignals(preArrival);
        const bagStorage = await firebase.get<BagStorageData>(`bagStorage/${uuid}`);
        const bagDropRequested = Boolean(
          bagStorage?.requestStatus && bagStorage.requestStatus !== 'completed',
        );

        return jsonResponse({
          guestName: formatGuestName(
            occupant.firstName ?? 'Guest',
            occupant.lastName ?? '',
          ),
          roomAssignment: occupant.room ?? 'Not assigned',
          checkInDate: occupant.checkInDate ?? '',
          checkOutDate: occupant.checkOutDate ?? '',
          nights: occupant.nights ?? 1,
          cityTaxDue: occupant.cityTax?.totalDue ?? 0,
          depositDue: KEYCARD_DEPOSIT,
          etaWindow: preArrival?.etaWindow ?? null,
          etaMethod: preArrival?.etaMethod ?? null,
          readiness,
          personalization: {
            arrivalMethodPreference: preArrival?.arrivalMethodPreference ?? null,
            arrivalConfidence: preArrival?.arrivalConfidence ?? null,
          },
          operational: {
            bagDropRequested,
          },
        });
      }
    }

    return errorResponse('Guest not found', 404);
  } catch (error) {
    console.error('Error looking up check-in code:', error);
    return errorResponse('Lookup failed', 500);
  }
};
