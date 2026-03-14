/**
 * Guest email matching service for the inbox.
 *
 * Fetches active bookings from Firebase RTDB, builds a transient email→booking
 * map, and matches sender emails to guest profiles. Designed to be called once
 * per sync batch (buildGuestEmailMap) with per-thread lookups (matchSenderToGuest).
 */

import { bookingRootPath, guestDetailsBookingPath, HOSPITALITY_RTDB_ROOTS } from "@acme/lib/hospitality";

import { buildFirebaseUrl, fetchFirebaseJson } from "./firebase-rtdb.server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GuestMatch = {
  bookingRef: string;
  occupantId: string;
  firstName: string;
  lastName: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumbers: string[];
  leadGuest: boolean;
};

/** Map of lowercased email → GuestMatch (most recent booking wins). */
export type GuestEmailMap = Map<string, GuestMatch>;

export type GuestEmailMapStatus =
  | "ok"
  | "firebase_http_error"
  | "firebase_network_error"
  | "config_error";

/** Non-throwing result from buildGuestEmailMap. `map` is always valid (possibly empty). */
export type GuestEmailMapResult = {
  map: GuestEmailMap;
  status: GuestEmailMapStatus;
  error?: string;
  durationMs: number;
  guestCount: number;
};

// ---------------------------------------------------------------------------
// Firebase response shapes (loose — validated at runtime)
// ---------------------------------------------------------------------------

type FirebaseOccupantBooking = {
  checkInDate?: string;
  checkOutDate?: string;
  leadGuest?: boolean;
  roomNumbers?: (string | number)[];
};

type FirebaseOccupantDetails = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the booking overlaps the active window:
 * check-in ≤ today + 7 days AND check-out ≥ today − 7 days.
 *
 * The 7-day cushion on both sides captures guests who booked recently or
 * are departing soon (so follow-up emails are still matched).
 */
export function isActiveBooking(
  checkInDate: string | undefined,
  checkOutDate: string | undefined,
  now: Date = new Date(),
): boolean {
  if (!checkInDate || !checkOutDate) return false;

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return false;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const windowStart = new Date(now.getTime() - sevenDaysMs);
  const windowEnd = new Date(now.getTime() + sevenDaysMs);

  // Booking overlaps the active window
  return checkIn <= windowEnd && checkOut >= windowStart;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch active bookings from Firebase RTDB and build an email→GuestMatch map.
 *
 * Call once per sync batch. The returned result object is non-throwing — errors
 * are captured in `status` and `error` fields. `map` is always a valid
 * (possibly empty) Map. Pass `result.map` to `matchSenderToGuest()` for each
 * thread in the batch.
 */
export async function buildGuestEmailMap(
  now: Date = new Date(),
): Promise<GuestEmailMapResult> {
  const startMs = performance.now();
  const map: GuestEmailMap = new Map();

  // Validate config before network calls
  try {
    buildFirebaseUrl(`/${HOSPITALITY_RTDB_ROOTS.bookings}`); // throws if FIREBASE_BASE_URL is not configured
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[guest-matcher] Config error:", errorMessage);
    return {
      map,
      status: "config_error" as const,
      error: errorMessage,
      durationMs: performance.now() - startMs,
      guestCount: 0,
    };
  }

  let bookingsData: Record<string, Record<string, FirebaseOccupantBooking>> | null;
  let guestDetailsData: Record<string, Record<string, FirebaseOccupantDetails>> | null;

  try {
    const [bookingsResp, guestDetailsResp] = await Promise.all([
      fetchFirebaseJson(`/${HOSPITALITY_RTDB_ROOTS.bookings}`),
      fetchFirebaseJson(`/${HOSPITALITY_RTDB_ROOTS.guestDetails}`),
    ]);
    bookingsData = bookingsResp as typeof bookingsData;
    guestDetailsData = guestDetailsResp as typeof guestDetailsData;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const status = /HTTP\s+\d+/.test(errorMessage) ? "firebase_http_error" : "firebase_network_error";
    console.error("[guest-matcher] Firebase REST error:", err);
    return {
      map,
      status,
      error: errorMessage,
      durationMs: performance.now() - startMs,
      guestCount: 0,
    };
  }

  if (!bookingsData || !guestDetailsData) {
    return {
      map,
      status: "ok",
      durationMs: performance.now() - startMs,
      guestCount: 0,
    };
  }

  for (const [bookingRef, occupants] of Object.entries(bookingsData)) {
    if (!occupants || typeof occupants !== "object") continue;

    for (const [occupantId, booking] of Object.entries(occupants)) {
      // Skip notes and non-occupant keys
      if (occupantId.startsWith("__")) continue;

      if (!isActiveBooking(booking.checkInDate, booking.checkOutDate, now)) {
        continue;
      }

      const details = guestDetailsData[bookingRef]?.[occupantId];
      if (!details?.email) continue;

      const emailKey = details.email.trim().toLowerCase();
      if (!emailKey) continue;

      const existing = map.get(emailKey);

      // If duplicate email, keep the most recent check-in
      if (existing) {
        const existingCheckIn = new Date(existing.checkInDate);
        const currentCheckIn = new Date(booking.checkInDate ?? "");
        if (existingCheckIn >= currentCheckIn) continue;
      }

      map.set(emailKey, {
        bookingRef,
        occupantId,
        firstName: details.firstName ?? "",
        lastName: details.lastName ?? "",
        email: details.email,
        checkInDate: booking.checkInDate ?? "",
        checkOutDate: booking.checkOutDate ?? "",
        roomNumbers: (booking.roomNumbers ?? []).map(String),
        leadGuest: booking.leadGuest ?? false,
      });
    }
  }

  return {
    map,
    status: "ok",
    durationMs: performance.now() - startMs,
    guestCount: map.size,
  };
}

/**
 * Look up a sender email in the pre-built guest email map.
 *
 * Pure synchronous lookup — no network calls.
 * Returns null when no match is found (graceful degradation).
 */
export function matchSenderToGuest(
  map: GuestEmailMap,
  senderEmail: string,
): GuestMatch | null {
  if (!senderEmail) return null;
  const key = senderEmail.trim().toLowerCase();
  return map.get(key) ?? null;
}

// ---------------------------------------------------------------------------
// Prime guest name lookup
// ---------------------------------------------------------------------------

const PRIME_GUEST_NAME_SENTINEL_IDS = new Set(["", "activity"]);
const PRIME_GUEST_NAMES_CONCURRENCY = 10;

/**
 * Fetch lead-guest first and last names for a set of Prime booking refs from
 * Firebase RTDB. Used to augment Prime inbox thread summaries with guest names.
 *
 * Fail-open: Firebase errors per ref are logged and that ref is absent from the
 * returned Map (caller sees null names). Uses Promise.allSettled so a failure
 * on one ref does not abort others.
 *
 * @param bookingRefs - Array of bookingRef strings (may contain duplicates or
 *   sentinel values `''` and `'activity'` — both are filtered before any fetch).
 * @returns Map from bookingRef → { firstName, lastName }. Empty Map when all
 *   refs are filtered or when the input array is empty.
 */
export async function fetchPrimeGuestNames(
  bookingRefs: string[],
): Promise<Map<string, { firstName: string; lastName: string }>> {
  const result = new Map<string, { firstName: string; lastName: string }>();

  // Deduplicate and strip sentinel IDs before any path construction.
  const uniqueRefs = [
    ...new Set(bookingRefs.filter((ref) => !PRIME_GUEST_NAME_SENTINEL_IDS.has(ref))),
  ];

  if (uniqueRefs.length === 0) {
    return result;
  }

  // Process in batches of PRIME_GUEST_NAMES_CONCURRENCY to bound concurrency.
  for (let i = 0; i < uniqueRefs.length; i += PRIME_GUEST_NAMES_CONCURRENCY) {
    const batch = uniqueRefs.slice(i, i + PRIME_GUEST_NAMES_CONCURRENCY);

    const settled = await Promise.allSettled(
      batch.map(async (ref) => {
        const [bookingsRaw, detailsRaw] = await Promise.all([
          fetchFirebaseJson(`/${bookingRootPath(ref)}`),
          fetchFirebaseJson(`/${guestDetailsBookingPath(ref)}`),
        ]);

        const occupants = bookingsRaw as Record<string, FirebaseOccupantBooking> | null;
        const details = detailsRaw as Record<string, FirebaseOccupantDetails> | null;

        if (!occupants || !details) {
          return null;
        }

        // Find lead guest occupantId from bookings data.
        let leadOccupantId: string | null = null;
        for (const [occupantId, booking] of Object.entries(occupants)) {
          if (occupantId.startsWith("__")) continue;
          if (booking.leadGuest === true) {
            leadOccupantId = occupantId;
            break;
          }
        }

        // Try lead occupant first; fall back to first occupant with a firstName.
        if (leadOccupantId) {
          const d = details[leadOccupantId];
          if (d?.firstName) {
            return { ref, firstName: d.firstName, lastName: d.lastName ?? "" };
          }
        }

        // Fallback: first occupant in guestsDetails with a non-empty firstName.
        for (const [occupantId, d] of Object.entries(details)) {
          if (occupantId.startsWith("__")) continue;
          if (d?.firstName) {
            return { ref, firstName: d.firstName, lastName: d.lastName ?? "" };
          }
        }

        return null;
      }),
    );

    for (let j = 0; j < settled.length; j++) {
      const ref = batch[j];
      const entry = settled[j];
      if (entry.status === "rejected") {
        const errMsg = entry.reason instanceof Error ? entry.reason.message : String(entry.reason);
        console.error(`[prime-guest-names] Firebase error for bookingRef: ${ref} — ${errMsg}`);
      } else if (entry.value !== null) {
        result.set(entry.value.ref, {
          firstName: entry.value.firstName,
          lastName: entry.value.lastName,
        });
      }
    }
  }

  return result;
}
