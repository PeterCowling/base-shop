/**
 * CF Pages Function: /api/bag-drop-request
 *
 * Checked-out guests can request post-checkout bag drop.
 * Writes a Prime request record and syncs bagStorage node for staff surfaces.
 */

import { FirebaseRest, errorResponse, jsonResponse } from '../lib/firebase-rest';
import { validateGuestSessionToken } from '../lib/guest-session';
import { buildPrimeRequestId, createPrimeRequestRecord, createPrimeRequestWritePayload } from '../lib/prime-requests';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
}

interface BagDropRequestBody {
  token?: string;
  pickupWindow?: string;
  note?: string;
}

interface BookingOccupantRecord {
  checkOutDate?: string;
  firstName?: string;
  lastName?: string;
}

interface BagStorageRecord {
  optedIn?: boolean;
  requestStatus?: string;
  requestId?: string;
}

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const MAX_REQUESTS_PER_HOUR = 3;

function todayInRome(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: BagDropRequestBody;
  try {
    body = await request.json() as BagDropRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const pickupWindow = (body.pickupWindow ?? '').trim();
  const note = (body.note ?? '').trim();

  if (!pickupWindow) {
    return errorResponse('pickupWindow is required', 400);
  }
  if (note.length > 500) {
    return errorResponse('note must be 500 characters or fewer', 400);
  }

  try {
    const authResult = await validateGuestSessionToken(body.token ?? null, env);
    if (authResult instanceof Response) {
      return authResult;
    }

    const guestUuid = authResult.session.guestUuid;
    if (!guestUuid) {
      return errorResponse('guestUuid missing for session', 422);
    }

    if (env.RATE_LIMIT) {
      const key = `bag-drop-rate:${guestUuid}`;
      const rawCount = await env.RATE_LIMIT.get(key);
      const count = parseInt(rawCount ?? '0', 10);
      if (count >= MAX_REQUESTS_PER_HOUR) {
        return errorResponse('Too many bag-drop requests. Please wait before retrying.', 429);
      }
      await env.RATE_LIMIT.put(key, String(count + 1), {
        expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
      });
    }

    const firebase = new FirebaseRest(env);
    const occupant = await firebase.get<BookingOccupantRecord>(
      `bookings/${authResult.session.bookingId}/${guestUuid}`,
    );
    if (!occupant?.checkOutDate) {
      return errorResponse('Current checkout date unavailable for this booking', 422);
    }

    if (occupant.checkOutDate > todayInRome()) {
      return errorResponse('Bag drop is only available after checkout', 403);
    }

    const bagStorage = await firebase.get<BagStorageRecord>(`bagStorage/${guestUuid}`);
    if (bagStorage?.requestStatus && bagStorage.requestStatus !== 'completed') {
      return jsonResponse({
        success: true,
        deduplicated: true,
        requestId: bagStorage.requestId ?? null,
        message: 'An active bag-drop request already exists.',
      });
    }

    const guestName = `${occupant.firstName ?? ''} ${occupant.lastName ?? ''}`.trim() || 'Guest';
    const requestId = buildPrimeRequestId('bag_drop');
    const requestRecord = createPrimeRequestRecord({
      requestId,
      type: 'bag_drop',
      bookingId: authResult.session.bookingId,
      guestUuid,
      guestName,
      note,
      payload: {
        pickupWindow,
      },
    });

    await firebase.update('/', {
      ...createPrimeRequestWritePayload(requestRecord),
      [`bagStorage/${guestUuid}`]: {
        optedIn: true,
        requestStatus: 'pending',
        pickupWindow,
        note,
        requestId,
        updatedAt: Date.now(),
      },
    });

    return jsonResponse({
      success: true,
      requestId,
      message: 'Bag-drop request submitted. Reception will confirm shortly.',
    });
  } catch (error) {
    console.error('Failed to create bag-drop request:', error);
    return errorResponse('Failed to submit bag-drop request', 500);
  }
};
