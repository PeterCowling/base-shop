/**
 * Guest email matching service for the inbox.
 *
 * Fetches active bookings from Firebase RTDB, builds a transient email→booking
 * map, and matches sender emails to guest profiles. Designed to be called once
 * per sync batch (buildGuestEmailMap) with per-thread lookups (matchSenderToGuest).
 */

import { FIREBASE_BASE_URL } from "../../utils/emailConstants";

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

function buildFirebaseUrl(path: string): string {
  const base = FIREBASE_BASE_URL;
  if (!base) throw new Error("FIREBASE_BASE_URL is not configured");

  const secret = typeof process !== "undefined"
    ? process.env.FIREBASE_DB_SECRET
    : undefined;

  const url = `${base}${path}.json`;
  return secret ? `${url}?auth=${secret}` : url;
}

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
    buildFirebaseUrl("/bookings"); // throws if FIREBASE_BASE_URL is not configured
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
      fetch(buildFirebaseUrl("/bookings")),
      fetch(buildFirebaseUrl("/guestsDetails")),
    ]);

    if (!bookingsResp.ok || !guestDetailsResp.ok) {
      const errorDetail = `bookings=${bookingsResp.status}, guestDetails=${guestDetailsResp.status}`;
      console.error(`[guest-matcher] Firebase fetch failed: ${errorDetail}`);
      return {
        map,
        status: "firebase_http_error",
        error: errorDetail,
        durationMs: performance.now() - startMs,
        guestCount: 0,
      };
    }

    bookingsData = await bookingsResp.json() as typeof bookingsData;
    guestDetailsData = await guestDetailsResp.json() as typeof guestDetailsData;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[guest-matcher] Firebase REST error:", err);
    return {
      map,
      status: "firebase_network_error",
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
