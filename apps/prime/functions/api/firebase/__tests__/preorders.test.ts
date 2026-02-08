/**
 * @jest-environment node
 */

import { onRequestPost } from "../preorders";
import { FirebaseRest } from "../../../lib/firebase-rest";
import { createPagesContext } from "../../../__tests__/helpers";

describe("/api/firebase/preorders", () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, "get");
  const setSpy = jest.spyOn(FirebaseRest.prototype, "set");
  const updateSpy = jest.spyOn(FirebaseRest.prototype, "update");

  beforeEach(() => {
    jest.clearAllMocks();
    setSpy.mockResolvedValue(undefined);
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    setSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("TC-01: eligible guest can create future-date order", async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "preorder/occ_1234567890123") {
        return {
          night1: {
            night: "Night1",
            breakfast: "PREPAID_MP_A",
            drink1: "APERITIVO",
            drink2: "NA",
            serviceDate: "2099-02-10",
          },
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/firebase/preorders",
        method: "POST",
        body: {
          token: "token-1",
          service: "breakfast",
          serviceDate: "2099-02-11",
          value: "Continental",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it("TC-03: same-day edit is blocked by policy", async () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "preorder/occ_1234567890123") {
        return {
          night1: {
            night: "Night1",
            breakfast: "Continental",
            drink1: "NA",
            drink2: "NA",
            serviceDate: today,
          },
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/firebase/preorders",
        method: "POST",
        body: {
          token: "token-1",
          service: "breakfast",
          serviceDate: today,
          value: "Vegan",
        },
      }),
    );

    expect(response.status).toBe(409);
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("TC-04: same-day exception request creates meal_change_exception queue item", async () => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "preorder/occ_1234567890123") {
        return {
          night1: {
            night: "Night1",
            breakfast: "Continental",
            drink1: "NA",
            drink2: "NA",
            serviceDate: today,
          },
        };
      }
      if (path === "bookings/BOOK123/occ_1234567890123") {
        return {
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/firebase/preorders",
        method: "POST",
        body: {
          token: "token-1",
          service: "breakfast",
          serviceDate: today,
          value: "Vegan",
          requestChangeException: true,
        },
      }),
    );

    expect(response.status).toBe(202);
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});
