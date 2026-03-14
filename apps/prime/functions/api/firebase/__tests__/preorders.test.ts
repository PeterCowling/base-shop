/**
 * @jest-environment node
 */

import { createPagesContext } from "../../../__tests__/helpers";
import { FirebaseRest } from "../../../lib/firebase-rest";
import { onRequestPost } from "../preorders";

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

  // TC-01 updated: eligible guest uses atomic update (not set) for future-date order
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
      // bookings occupant read for guest name
      if (path === "bookings/BOOK123/occ_1234567890123") {
        return { firstName: "Alice", lastName: "Smith" };
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
    // Bridge write uses update, not set
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);
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
    expect(updateSpy).not.toHaveBeenCalled();
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

  // TC-05: Breakfast bridge — full multi-path payload asserted
  it("TC-05: breakfast bridge write — multi-path payload has correct structure", async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_abc123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "preorder/occ_abc123") {
        return {
          night1: {
            night: "night1",
            breakfast: "PREPAID_MP_A",
            drink1: "APERITIVO",
            drink2: "NA",
            serviceDate: "2099-03-15",
          },
        };
      }
      if (path === "bookings/BOOK123/occ_abc123") {
        return { firstName: "John", lastName: "Doe" };
      }
      return null;
    });

    const orderValue = "Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00";

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/firebase/preorders",
        method: "POST",
        body: {
          token: "token-1",
          service: "breakfast",
          serviceDate: "2099-03-16",
          value: orderValue,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const payload = updateSpy.mock.calls[0]?.[1] as Record<string, unknown>;

    // Preorder path key
    const preorderKey = "preorder/occ_abc123/night2";
    expect(payload).toHaveProperty(preorderKey);
    const preorderNode = payload[preorderKey] as Record<string, unknown>;

    // breakfast field is NOT overwritten — retains entitlement value
    expect(preorderNode["breakfast"]).toBe("PREPAID_MP_A");
    // breakfastTxnId is the new backref field
    expect(typeof preorderNode["breakfastTxnId"]).toBe("string");
    expect((preorderNode["breakfastTxnId"] as string)).toMatch(/^txn_\d{17}$/);
    // breakfastText holds the pipe string
    expect(preorderNode["breakfastText"]).toBe(orderValue);
    // drink1 is preserved
    expect(preorderNode["drink1"]).toBe("APERITIVO");

    // Bar record key: barOrders/breakfastPreorders/March/16/{txnId}
    const txnId = preorderNode["breakfastTxnId"] as string;
    const barKey = `barOrders/breakfastPreorders/March/16/${txnId}`;
    expect(payload).toHaveProperty(barKey);
    const barRecord = payload[barKey] as Record<string, unknown>;

    expect(barRecord["guestFirstName"]).toBe("John");
    expect(barRecord["guestSurname"]).toBe("Doe");
    expect(barRecord["uuid"]).toBe("occ_abc123");
    expect(barRecord["preorderTime"]).toBe("09:00");
    expect(Array.isArray(barRecord["items"])).toBe(true);
    const items = barRecord["items"] as Array<Record<string, unknown>>;
    // Food item is kds
    expect(items[0]).toEqual({ product: "Eggs (Scrambled)", count: 1, lineType: "kds", price: 0 });
    // Side items are bds
    expect(items[1]).toEqual({ product: "Bacon", count: 1, lineType: "bds", price: 0 });
    expect(items[2]).toEqual({ product: "Ham", count: 1, lineType: "bds", price: 0 });
    expect(items[3]).toEqual({ product: "Toast", count: 1, lineType: "bds", price: 0 });
    // Drink item is bds
    expect(items[4]).toEqual({ product: "Americano, Oat Milk, No Sugar", count: 1, lineType: "bds", price: 0 });
  });

  // TC-06: Drink bridge — drink1 field unchanged in preorder node
  it("TC-06: drink bridge write — drink1 entitlement field is NOT overwritten", async () => {
    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK456",
          guestUuid: "occ_xyz789",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "preorder/occ_xyz789") {
        return {
          night1: {
            night: "night1",
            breakfast: "NA",
            drink1: "PREPAID MP B",
            drink2: "NA",
            serviceDate: "2099-05-01",
          },
        };
      }
      if (path === "bookings/BOOK456/occ_xyz789") {
        return { firstName: "Maria", lastName: "Rossi" };
      }
      return null;
    });

    const drinkValue = "Aperol Spritz | 19:30";

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/firebase/preorders",
        method: "POST",
        body: {
          token: "token-1",
          service: "drink",
          serviceDate: "2099-05-02",
          value: drinkValue,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(setSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const payload = updateSpy.mock.calls[0]?.[1] as Record<string, unknown>;

    const preorderKey = "preorder/occ_xyz789/night2";
    expect(payload).toHaveProperty(preorderKey);
    const preorderNode = payload[preorderKey] as Record<string, unknown>;

    // drink1 must NOT be overwritten — retains entitlement marker
    expect(preorderNode["drink1"]).toBe("PREPAID MP B");
    // drink1Txn is the backref
    expect(typeof preorderNode["drink1Txn"]).toBe("string");
    expect((preorderNode["drink1Txn"] as string)).toMatch(/^txn_\d{17}$/);
    // drink1Text holds the pipe string
    expect(preorderNode["drink1Text"]).toBe(drinkValue);
    // breakfast is unchanged
    expect(preorderNode["breakfast"]).toBe("NA");

    // Bar record key: barOrders/evDrinkPreorders/May/2/{txnId}
    const txnId = preorderNode["drink1Txn"] as string;
    const barKey = `barOrders/evDrinkPreorders/May/2/${txnId}`;
    expect(payload).toHaveProperty(barKey);
    const barRecord = payload[barKey] as Record<string, unknown>;

    expect(barRecord["guestFirstName"]).toBe("Maria");
    expect(barRecord["guestSurname"]).toBe("Rossi");
    expect(barRecord["uuid"]).toBe("occ_xyz789");
    expect(barRecord["preorderTime"]).toBe("19:30");
    const items = barRecord["items"] as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ product: "Aperol Spritz", count: 1, lineType: "bds", price: 0 });
  });

  // TC-07: firebase.update failure → handler returns 500; console.error called
  it("TC-07: firebase.update failure returns 500 and logs error", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_fail",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "preorder/occ_fail") {
        return {
          night1: {
            night: "night1",
            breakfast: "PREPAID_MP_A",
            drink1: "NA",
            drink2: "NA",
            serviceDate: "2099-06-01",
          },
        };
      }
      if (path === "bookings/BOOK123/occ_fail") {
        return { firstName: "Test", lastName: "User" };
      }
      return null;
    });

    updateSpy.mockRejectedValueOnce(new Error("Firebase UPDATE failed: 500 Internal Server Error"));

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/firebase/preorders",
        method: "POST",
        body: {
          token: "token-1",
          service: "breakfast",
          serviceDate: "2099-06-02",
          value: "Continental | 09:00",
        },
      }),
    );

    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith("Error saving preorder:", expect.any(Error));
    errorSpy.mockRestore();
  });
});
