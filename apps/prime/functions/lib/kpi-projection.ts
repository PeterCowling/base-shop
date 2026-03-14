/**
 * KPI Projection Shim
 *
 * Reads raw guest data from 6 Firebase RTDB roots and assembles a `RawDayData`
 * object compatible with `kpiAggregator.ts`'s `aggregateDailyKpis()`.
 *
 * This module is the adapter layer between the actual RTDB schema (distributed
 * across multiple top-level roots) and the aggregator's expected input shape.
 *
 * The aggregator (`kpiAggregator.ts`) is frozen — do not modify it.
 */

import type { RawDayData } from '../../src/lib/owner/kpiAggregator';
import type { PrimeRequestRecord } from '../../src/types/primeRequests';

import { type FirebaseRest } from './firebase-rest';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A resolved guest entry with UUID and the booking reference it belongs to.
 * In the primary path (`roomsByDate`), `bookingRef` is read from the path.
 * In the fallback path (`bookings` full scan), `bookingRef` is an empty string
 * and the shim must use `occupantIndex/{uuid}` to resolve it.
 */
export interface GuestEntry {
  uuid: string;
  bookingRef: string; // empty string → use occupantIndex lookup
}

/**
 * Result from `enumerateGuestsByDate`.
 */
export interface EnumerationResult {
  entries: GuestEntry[];
  enumerationPath: 'primary' | 'fallback';
}

// ---------------------------------------------------------------------------
// Internal RTDB shape types
// ---------------------------------------------------------------------------

interface BookingOccupantNode {
  checkInDate?: string;
  checkOutDate?: string;
  leadGuest?: boolean;
  roomNumbers?: string[];
}

interface CheckInCodeNode {
  code?: string;
  uuid?: string;
  createdAt?: number;
  expiresAt?: number;
}

interface CheckinNode {
  timestamp?: string;
}

interface PreArrivalNode {
  checklistProgress?: {
    routePlanned?: boolean;
    etaConfirmed?: boolean;
    cashPrepared?: boolean;
    rulesReviewed?: boolean;
    locationSaved?: boolean;
  };
  etaConfirmedAt?: number | null;
}

// ---------------------------------------------------------------------------
// enumerateGuestsByDate
// ---------------------------------------------------------------------------

/**
 * Enumerate all guest UUIDs checking in on a given date.
 *
 * Primary path: `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]`
 * Fallback path: full `bookings` scan filtered by `checkInDate` field (in-memory)
 *
 * The `bookingRef` is available directly from the primary path structure.
 * The fallback only fires when `roomsByDate/{date}` returns null/empty.
 */
export async function enumerateGuestsByDate(
  date: string,
  firebase: FirebaseRest,
): Promise<EnumerationResult> {
  // Primary: roomsByDate
  const roomsByDate = await firebase.get<Record<string, Record<string, { guestIds?: string[] }>>>(
    `roomsByDate/${date}`,
  );

  if (roomsByDate && Object.keys(roomsByDate).length > 0) {
    const entries: GuestEntry[] = [];

    for (const [, roomEntry] of Object.entries(roomsByDate)) {
      for (const [bookingRef, bookingEntry] of Object.entries(roomEntry)) {
        const guestIds = bookingEntry?.guestIds ?? [];
        for (const uuid of guestIds) {
          if (uuid) {
            entries.push({ uuid, bookingRef });
          }
        }
      }
    }

    return { entries, enumerationPath: 'primary' };
  }

  // Fallback: full bookings scan
  console.warn(
    `[kpi-projection] roomsByDate/${date} empty — falling back to full bookings scan`,
  );

  const allBookings = await firebase.get<Record<string, Record<string, BookingOccupantNode>>>(
    'bookings',
  );

  if (!allBookings) {
    return { entries: [], enumerationPath: 'fallback' };
  }

  const entries: GuestEntry[] = [];

  for (const [bookingRef, occupantsMap] of Object.entries(allBookings)) {
    if (!occupantsMap) continue;
    for (const [uuid, occupant] of Object.entries(occupantsMap)) {
      if (occupant?.checkInDate === date) {
        entries.push({ uuid, bookingRef });
      }
    }
  }

  return { entries, enumerationPath: 'fallback' };
}

// ---------------------------------------------------------------------------
// projectGuestKpiData
// ---------------------------------------------------------------------------

/**
 * Project raw RTDB data for a list of guests into a `RawDayData` object
 * compatible with `aggregateDailyKpis()`.
 *
 * Each guest entry must include:
 * - `uuid`: guest UUID
 * - `bookingRef`: reservation code (from `roomsByDate` path in primary enumeration,
 *   or resolved via `occupantIndex/{uuid}` in fallback; pass empty string to trigger
 *   occupantIndex lookup)
 *
 * Reads per guest:
 * 1. `bookings/{bookingRef}/{uuid}` — occupant dates and metadata
 * 2. `checkInCodes/byUuid/{uuid}` — check-in code (for `arrivalCodeGenPct`)
 * 3. `checkins/{date}/{uuid}` — check-in timestamp (for `medianCheckInLagMinutes`)
 * 4. `preArrival/{uuid}` — checklist + ETA (for `readinessCompletionPct`, `etaSubmissionPct`)
 * 5. `primeRequests/byGuest/{uuid}` — request IDs
 * 6. `primeRequests/byId/{requestId}` — per request for type classification (extension / bag_drop)
 * 7. `bagStorage/{uuid}` — bag storage record (reserved for future use)
 */
export async function projectGuestKpiData(
  date: string,
  guestEntries: GuestEntry[],
  firebase: FirebaseRest,
): Promise<RawDayData> {
  const bookings: RawDayData['bookings'] = {};

  for (const entry of guestEntries) {
    const { uuid } = entry;
    let { bookingRef } = entry;

    // Resolve bookingRef via occupantIndex when not pre-provided (fallback path)
    if (!bookingRef) {
      const occupantIndex = await firebase.get<{ reservationCode?: string }>(
        `occupantIndex/${uuid}`,
      );
      if (!occupantIndex?.reservationCode) {
        console.warn(
          `[kpi-projection] occupantIndex/${uuid} miss — skipping guest`,
          { uuid },
        );
        continue;
      }
      bookingRef = occupantIndex.reservationCode;
    }

    // 1. Booking occupant node (dates, metadata)
    const occupantNode = await firebase.get<BookingOccupantNode>(
      `bookings/${bookingRef}/${uuid}`,
    );

    const checkInDate = occupantNode?.checkInDate ?? date;

    // 2. Check-in code
    const checkInCodeNode = await firebase.get<CheckInCodeNode>(
      `checkInCodes/byUuid/${uuid}`,
    );
    const checkInCode = checkInCodeNode?.code ?? null;

    // 3. Check-in timestamp → milliseconds
    const checkinNode = await firebase.get<CheckinNode>(
      `checkins/${date}/${uuid}`,
    );
    let checkInAt: number | null = null;
    if (checkinNode?.timestamp) {
      const parsed = Date.parse(checkinNode.timestamp);
      if (!Number.isNaN(parsed)) {
        checkInAt = parsed;
      }
    }

    // 4. Pre-arrival data
    const preArrivalNode = await firebase.get<PreArrivalNode>(
      `preArrival/${uuid}`,
    );
    const preArrival = preArrivalNode
      ? {
          checklistProgress: preArrivalNode.checklistProgress
            ? {
                routePlanned: preArrivalNode.checklistProgress.routePlanned ?? false,
                etaConfirmed: preArrivalNode.checklistProgress.etaConfirmed ?? false,
                cashPrepared: preArrivalNode.checklistProgress.cashPrepared ?? false,
                rulesReviewed: preArrivalNode.checklistProgress.rulesReviewed ?? false,
                locationSaved: preArrivalNode.checklistProgress.locationSaved ?? false,
              }
            : undefined,
          etaConfirmedAt: preArrivalNode.etaConfirmedAt ?? null,
        }
      : null;

    // 5. Prime requests by guest — boolean-keyed map { [requestId]: true }
    const requestsByGuest = await firebase.get<Record<string, boolean>>(
      `primeRequests/byGuest/${uuid}`,
    );

    const extensionRequests: Record<string, unknown> = {};
    const bagDropRequests: Record<string, unknown> = {};

    if (requestsByGuest) {
      for (const requestId of Object.keys(requestsByGuest)) {
        // 6. Fetch full request record for type classification
        const requestRecord = await firebase.get<PrimeRequestRecord>(
          `primeRequests/byId/${requestId}`,
        );
        if (!requestRecord) {
          console.debug(`[kpi-projection] primeRequests/byId/${requestId} null — skipping`);
          continue;
        }
        if (requestRecord.type === 'extension') {
          extensionRequests[requestId] = true;
        } else if (requestRecord.type === 'bag_drop') {
          bagDropRequests[requestId] = true;
        }
        // 'meal_change_exception' and unknown types are intentionally ignored
      }
    }

    // 7. Bag storage (reserved; presence recorded but not currently used by aggregator)
    await firebase.get(`bagStorage/${uuid}`);

    // Assemble BookingData entry (keyed by bookingRef, one occupant per UUID)
    if (!bookings[bookingRef]) {
      bookings[bookingRef] = {
        checkInDate,
        checkInCode,
        checkInAt,
        occupants: {},
      };
    } else {
      // Update booking-level fields if not yet set (first guest sets them)
      if (bookings[bookingRef].checkInCode == null && checkInCode != null) {
        bookings[bookingRef].checkInCode = checkInCode;
      }
      if (bookings[bookingRef].checkInAt == null && checkInAt != null) {
        bookings[bookingRef].checkInAt = checkInAt;
      }
    }

    // Attach occupant to the booking
    bookings[bookingRef].occupants![uuid] = {
      preArrival,
      extensionRequests,
      bagDropRequests,
    };
  }

  return { bookings };
}
