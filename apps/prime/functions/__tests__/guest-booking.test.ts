/**
 * @jest-environment node
 */

import { onRequestGet } from "../api/guest-booking";
import { FirebaseRest } from "../lib/firebase-rest";

import { createPagesContext } from "./helpers";

function buildSession() {
  return {
    bookingId: "BOOK123",
    guestUuid: "occ_1234567890123",
    createdAt: "2026-02-01T00:00:00.000Z",
    expiresAt: "2099-02-01T00:00:00.000Z",
  };
}

describe("/api/guest-booking", () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, "get");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  it("TC-01: future check-in resolves pre-arrival", async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") return buildSession();
      if (path === "bookings/BOOK123") {
        return {
          occ_1234567890123: {
            checkInDate: "2099-02-10",
            checkOutDate: "2099-02-12",
            roomNumbers: ["3A"],
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: "https://prime.example.com/api/guest-booking?token=token-1",
      }),
    );
    const payload = await response.json() as { arrivalState: string };
    expect(response.status).toBe(200);
    expect(payload.arrivalState).toBe("pre-arrival");
  });

  it("TC-02: same-day with no check-in record resolves arrival-day", async () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") return buildSession();
      if (path === "bookings/BOOK123") {
        return {
          occ_1234567890123: {
            checkInDate: today,
            checkOutDate: "2099-02-12",
            roomNumbers: ["3A"],
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: "https://prime.example.com/api/guest-booking?token=token-1",
      }),
    );
    const payload = await response.json() as { arrivalState: string };
    expect(response.status).toBe(200);
    expect(payload.arrivalState).toBe("arrival-day");
  });

  it("TC-03: checked-in signal from checkins node resolves checked-in", async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") return buildSession();
      if (path === "bookings/BOOK123") {
        return {
          occ_1234567890123: {
            checkInDate: "2000-02-10",
            checkOutDate: "2099-02-12",
            roomNumbers: ["3A"],
          },
        };
      }
      if (path === "checkins/2000-02-10/occ_1234567890123") {
        return { timestamp: 1234 };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: "https://prime.example.com/api/guest-booking?token=token-1",
      }),
    );
    const payload = await response.json() as { arrivalState: string };
    expect(response.status).toBe(200);
    expect(payload.arrivalState).toBe("checked-in");
  });

  it("TC-04: past checkout resolves checked-out", async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") return buildSession();
      if (path === "bookings/BOOK123") {
        return {
          occ_1234567890123: {
            checkInDate: "2000-02-01",
            checkOutDate: "2000-02-03",
            roomNumbers: ["3A"],
          },
        };
      }
      return null;
    });

    const response = await onRequestGet(
      createPagesContext({
        url: "https://prime.example.com/api/guest-booking?token=token-1",
      }),
    );
    const payload = await response.json() as { arrivalState: string };
    expect(response.status).toBe(200);
    expect(payload.arrivalState).toBe("checked-out");
  });
});
