/**
 * Tests for guest-matcher.server.ts
 * Covers TC-01 through TC-06 from the plan validation contract.
 */

import {
  buildGuestEmailMap,
  type GuestEmailMap,
  isActiveBooking,
  matchSenderToGuest,
} from "../guest-matcher.server";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date("2026-03-07T12:00:00Z");

const ACTIVE_BOOKING_OCCUPANTS = {
  occ1: {
    checkInDate: "2026-03-05",
    checkOutDate: "2026-03-10",
    leadGuest: true,
    roomNumbers: ["101"],
  },
  occ2: {
    checkInDate: "2026-03-06",
    checkOutDate: "2026-03-09",
    leadGuest: false,
    roomNumbers: ["102"],
  },
};

const HISTORICAL_BOOKING_OCCUPANTS = {
  occ3: {
    checkInDate: "2026-01-01",
    checkOutDate: "2026-01-05",
    leadGuest: true,
    roomNumbers: ["201"],
  },
};

const GUEST_DETAILS = {
  "booking-active": {
    occ1: {
      email: "marco@example.com",
      firstName: "Marco",
      lastName: "Rossi",
    },
    occ2: {
      email: "anna@example.com",
      firstName: "Anna",
      lastName: "Bianchi",
    },
  },
  "booking-historical": {
    occ3: {
      email: "old-guest@example.com",
      firstName: "Old",
      lastName: "Guest",
    },
  },
  "booking-no-email": {
    occ4: {
      firstName: "No",
      lastName: "Email",
    },
  },
  "booking-recent": {
    occ5: {
      email: "marco@example.com",
      firstName: "Marco",
      lastName: "Rossi-Updated",
    },
  },
};

const BOOKINGS_DATA = {
  "booking-active": ACTIVE_BOOKING_OCCUPANTS,
  "booking-historical": HISTORICAL_BOOKING_OCCUPANTS,
  "booking-no-email": {
    occ4: {
      checkInDate: "2026-03-05",
      checkOutDate: "2026-03-10",
      leadGuest: true,
      roomNumbers: ["301"],
    },
  },
  "booking-recent": {
    occ5: {
      checkInDate: "2026-03-07",
      checkOutDate: "2026-03-12",
      leadGuest: true,
      roomNumbers: ["103"],
    },
  },
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

/** Extract URL string from fetch's first argument (may be string, URL, or Request). */
function extractUrl(input: unknown): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object" && "url" in input) return String((input as { url: string }).url);
  return String(input);
}

let mockFetch: jest.SpyInstance;

function mockFirebaseSuccess(
  bookings: unknown = BOOKINGS_DATA,
  guestDetails: unknown = GUEST_DETAILS,
) {
  mockFetch.mockImplementation((...args: unknown[]) => {
    const url = extractUrl(args[0]);
    if (url.includes("/bookings")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(bookings),
      });
    }
    if (url.includes("/guestsDetails")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(guestDetails),
      });
    }
    return Promise.resolve({ ok: false, status: 404 });
  });
}

function mockFirebaseError() {
  mockFetch.mockRejectedValue(new Error("Network error"));
}

function mockFirebaseHttpError(status = 403) {
  mockFetch.mockResolvedValue({ ok: false, status });
}

beforeEach(() => {
  mockFetch = jest.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve({ ok: false, status: 404 } as Response),
  );
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// isActiveBooking unit tests
// ---------------------------------------------------------------------------

describe("isActiveBooking", () => {
  it("returns true for a booking spanning today", () => {
    expect(isActiveBooking("2026-03-05", "2026-03-10", NOW)).toBe(true);
  });

  it("returns false for a historical booking (checked out >7 days ago)", () => {
    expect(isActiveBooking("2026-01-01", "2026-01-05", NOW)).toBe(false);
  });

  it("returns false when dates are missing", () => {
    expect(isActiveBooking(undefined, "2026-03-10", NOW)).toBe(false);
    expect(isActiveBooking("2026-03-05", undefined, NOW)).toBe(false);
  });

  it("returns false for invalid date strings", () => {
    expect(isActiveBooking("not-a-date", "2026-03-10", NOW)).toBe(false);
  });

  it("returns true for a booking checking in within 7 days", () => {
    expect(isActiveBooking("2026-03-12", "2026-03-15", NOW)).toBe(true);
  });

  it("returns false for a booking checking in >7 days from now", () => {
    expect(isActiveBooking("2026-03-20", "2026-03-25", NOW)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildGuestEmailMap + matchSenderToGuest integration
// ---------------------------------------------------------------------------

describe("buildGuestEmailMap + matchSenderToGuest", () => {
  // TC-01: Sender email matches active booking guest
  it("TC-01: matches sender email to active booking guest", async () => {
    mockFirebaseSuccess();
    const map = await buildGuestEmailMap(NOW);
    const match = matchSenderToGuest(map, "marco@example.com");

    expect(match).not.toBeNull();
    // Should match the most recent booking (booking-recent, occ5)
    expect(match!.bookingRef).toBe("booking-recent");
    expect(match!.occupantId).toBe("occ5");
    expect(match!.firstName).toBe("Marco");
    expect(match!.lastName).toBe("Rossi-Updated");
    expect(match!.checkInDate).toBe("2026-03-07");
    expect(match!.checkOutDate).toBe("2026-03-12");
    expect(match!.roomNumbers).toEqual(["103"]);
    expect(match!.leadGuest).toBe(true);
  });

  // TC-02: Sender email has no match
  it("TC-02: returns null when sender email has no match", async () => {
    mockFirebaseSuccess();
    const map = await buildGuestEmailMap(NOW);
    const match = matchSenderToGuest(map, "unknown@example.com");

    expect(match).toBeNull();
  });

  // TC-03: Historical booking (checked out >7 days ago) is excluded
  it("TC-03: excludes historical bookings from matches", async () => {
    mockFirebaseSuccess();
    const map = await buildGuestEmailMap(NOW);
    const match = matchSenderToGuest(map, "old-guest@example.com");

    expect(match).toBeNull();
  });

  // TC-04: Multiple bookings with same email → most recent
  it("TC-04: returns most recent booking when multiple match same email", async () => {
    mockFirebaseSuccess();
    const map = await buildGuestEmailMap(NOW);
    const match = matchSenderToGuest(map, "marco@example.com");

    expect(match).not.toBeNull();
    // booking-recent has checkInDate 2026-03-07 (later than booking-active's 2026-03-05)
    expect(match!.bookingRef).toBe("booking-recent");
    expect(match!.checkInDate).toBe("2026-03-07");
  });

  // TC-05: Firebase REST error
  it("TC-05: returns empty map on Firebase network error", async () => {
    mockFirebaseError();
    const map = await buildGuestEmailMap(NOW);

    expect(map.size).toBe(0);
    expect(console.error).toHaveBeenCalled();
  });

  it("TC-05b: returns empty map on Firebase HTTP error", async () => {
    mockFirebaseHttpError(403);
    const map = await buildGuestEmailMap(NOW);

    expect(map.size).toBe(0);
    expect(console.error).toHaveBeenCalled();
  });

  // TC-06: Case-insensitive email matching
  it("TC-06: matches email case-insensitively", async () => {
    mockFirebaseSuccess();
    const map = await buildGuestEmailMap(NOW);

    const match1 = matchSenderToGuest(map, "MARCO@EXAMPLE.COM");
    const match2 = matchSenderToGuest(map, "Marco@Example.Com");
    const match3 = matchSenderToGuest(map, "marco@example.com");

    expect(match1).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(match3).not.toBeNull();
    expect(match1!.bookingRef).toBe(match2!.bookingRef);
    expect(match2!.bookingRef).toBe(match3!.bookingRef);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("skips occupants with empty/undefined email", async () => {
    mockFirebaseSuccess();
    const map = await buildGuestEmailMap(NOW);

    // booking-no-email has no email field
    expect(map.size).toBe(2); // marco@... and anna@...
  });

  it("returns null for empty sender email", () => {
    const map: GuestEmailMap = new Map();
    expect(matchSenderToGuest(map, "")).toBeNull();
  });

  it("handles Firebase returning null/empty data", async () => {
    mockFirebaseSuccess(null, null);
    const map = await buildGuestEmailMap(NOW);

    expect(map.size).toBe(0);
  });

  it("handles Firebase returning empty objects", async () => {
    mockFirebaseSuccess({}, {});
    const map = await buildGuestEmailMap(NOW);

    expect(map.size).toBe(0);
  });

  it("skips __notes and other dunder keys in bookings", async () => {
    const bookingsWithNotes = {
      "booking-active": {
        ...ACTIVE_BOOKING_OCCUPANTS,
        __notes: { some: "note" },
      },
    };
    mockFirebaseSuccess(bookingsWithNotes);
    const map = await buildGuestEmailMap(NOW);

    // Should still find occ1 and occ2, not crash on __notes
    expect(map.has("marco@example.com")).toBe(true);
    expect(map.has("anna@example.com")).toBe(true);
  });

  it("appends ?auth= when FIREBASE_DB_SECRET is set", async () => {
    process.env.FIREBASE_DB_SECRET = "test-secret";
    mockFirebaseSuccess();

    await buildGuestEmailMap(NOW);

    const calls = mockFetch.mock.calls;
    expect(extractUrl(calls[0][0])).toContain("?auth=test-secret");
    expect(extractUrl(calls[1][0])).toContain("?auth=test-secret");

    delete process.env.FIREBASE_DB_SECRET;
  });
});
