/**
 * Unit tests for fetchPrimeGuestNames.
 *
 * Exercises the exported helper directly with a mocked global.fetch.
 * Firebase REST calls flow through global.fetch via fetchFirebaseJson.
 * The mock routes by URL path segment to return the appropriate response.
 *
 * TC-01: Happy path — lead-guest occupant identified and name returned.
 * TC-02: Empty-string bookingRef filtered — Firebase never called.
 * TC-03: 'activity' bookingRef filtered — Firebase never called.
 * TC-04: Both Firebase legs throw — console.error called; empty Map returned (no throw).
 * TC-05: Partial failure — one ref fails, other succeeds; partial Map returned.
 * TC-06: No leadGuest:true occupant — falls back to first-named occupant in guestsDetails.
 * TC-07: Duplicate bookingRefs in input — Firebase called once per unique ref.
 * TC-08: Empty input array — returns empty Map; Firebase never called.
 */

/* eslint-disable import/first */
jest.mock("server-only", () => ({}));

import { fetchPrimeGuestNames } from "../guest-matcher.server";

const FIREBASE_BASE = "https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app";

function makeBookingsResponse(occupantId: string, opts: { leadGuest?: boolean } = {}) {
  return {
    [occupantId]: {
      checkInDate: "2026-03-14",
      checkOutDate: "2026-03-16",
      leadGuest: opts.leadGuest ?? true,
    },
  };
}

function makeDetailsResponse(occupantId: string, firstName: string, lastName: string) {
  return {
    [occupantId]: {
      email: `${occupantId}@example.com`,
      firstName,
      lastName,
    },
  };
}

/**
 * Build a URL-routing mock that returns the correct Firebase response based on
 * whether the URL contains /bookings/ or /guestsDetails/.
 */
function makeFirebaseMock(
  bookingRef: string,
  bookingsPayload: object | null,
  detailsPayload: object | null,
) {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes(`/bookings/${bookingRef}`)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => bookingsPayload,
      });
    }
    if (url.includes(`/guestsDetails/${bookingRef}`)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => detailsPayload,
      });
    }
    return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
  });
}

describe("fetchPrimeGuestNames", () => {
  const originalEnv = process.env;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.resetAllMocks();
    console.error = jest.fn();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FIREBASE_DATABASE_URL: FIREBASE_BASE,
      FIREBASE_DB_SECRET: "test-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  describe("TC-01: Happy path — lead-guest occupant identified", () => {
    it("returns name for the occupant with leadGuest:true", async () => {
      const bookingsData = makeBookingsResponse("occ-1", { leadGuest: true });
      const detailsData = makeDetailsResponse("occ-1", "Ana", "Perez");

      global.fetch = makeFirebaseMock("booking-abc", bookingsData, detailsData) as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["booking-abc"]);

      expect(result.size).toBe(1);
      expect(result.get("booking-abc")).toEqual({ firstName: "Ana", lastName: "Perez" });
    });
  });

  describe("TC-02: Empty-string bookingRef filtered", () => {
    it("does not call Firebase and returns empty Map for empty-string ref", async () => {
      global.fetch = jest.fn() as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames([""]);

      expect(result.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("TC-03: 'activity' bookingRef filtered", () => {
    it("does not call Firebase and returns empty Map for 'activity' ref", async () => {
      global.fetch = jest.fn() as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["activity"]);

      expect(result.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("TC-04: Both Firebase legs throw — fail-open", () => {
    it("returns empty Map and calls console.error when Firebase fetch throws", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network failure")) as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["booking-abc"]);

      expect(result.size).toBe(0);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[prime-guest-names] Firebase error for bookingRef: booking-abc"),
      );
    });
  });

  describe("TC-05: Partial failure — one ref fails, other succeeds", () => {
    it("returns partial Map: successful ref present, failed ref absent; console.error called for failed ref", async () => {
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("/bookings/booking-good") || url.includes("/guestsDetails/booking-good")) {
          const isBookings = url.includes("/bookings/");
          const payload = isBookings
            ? makeBookingsResponse("occ-1", { leadGuest: true })
            : makeDetailsResponse("occ-1", "Bob", "Smith");
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => payload,
          });
        }
        if (url.includes("booking-bad")) {
          return Promise.reject(new Error("Firebase error for bad ref"));
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      }) as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["booking-good", "booking-bad"]);

      expect(result.size).toBe(1);
      expect(result.get("booking-good")).toEqual({ firstName: "Bob", lastName: "Smith" });
      expect(result.has("booking-bad")).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[prime-guest-names] Firebase error for bookingRef: booking-bad"),
      );
    });
  });

  describe("TC-06: No leadGuest:true occupant — fallback to first-named occupant", () => {
    it("returns first occupant with a firstName when no leadGuest:true in bookings", async () => {
      // Bookings has occ-x with leadGuest: false
      const bookingsData = { "occ-x": { checkInDate: "2026-03-14", checkOutDate: "2026-03-16", leadGuest: false } };
      // guestsDetails has occ-x with firstName 'Bob'
      const detailsData = { "occ-x": { email: "occ-x@example.com", firstName: "Bob", lastName: "Jones" } };

      global.fetch = makeFirebaseMock("booking-fallback", bookingsData, detailsData) as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["booking-fallback"]);

      expect(result.size).toBe(1);
      expect(result.get("booking-fallback")).toEqual({ firstName: "Bob", lastName: "Jones" });
    });
  });

  describe("TC-07: Duplicate bookingRefs — deduplicated to single Firebase call-pair", () => {
    it("calls Firebase once per unique ref when duplicates are present in input", async () => {
      const bookingsData = makeBookingsResponse("occ-1", { leadGuest: true });
      const detailsData = makeDetailsResponse("occ-1", "Ana", "Perez");
      const fetchMock = makeFirebaseMock("booking-abc", bookingsData, detailsData);
      global.fetch = fetchMock as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["booking-abc", "booking-abc", "booking-abc"]);

      expect(result.size).toBe(1);
      expect(result.get("booking-abc")).toEqual({ firstName: "Ana", lastName: "Perez" });
      // Two Firebase calls (bookings + guestsDetails) for a single unique ref
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("TC-08: Empty input array", () => {
    it("returns empty Map and does not call Firebase for empty input", async () => {
      global.fetch = jest.fn() as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames([]);

      expect(result.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("TC-09: Mix of sentinel and valid refs", () => {
    it("skips empty-string and 'activity' refs; processes only valid ref", async () => {
      const bookingsData = makeBookingsResponse("occ-1", { leadGuest: true });
      const detailsData = makeDetailsResponse("occ-1", "Maria", "Garcia");
      global.fetch = makeFirebaseMock("booking-valid", bookingsData, detailsData) as unknown as typeof fetch;

      const result = await fetchPrimeGuestNames(["", "activity", "booking-valid"]);

      expect(result.size).toBe(1);
      expect(result.get("booking-valid")).toEqual({ firstName: "Maria", lastName: "Garcia" });
    });
  });
});
