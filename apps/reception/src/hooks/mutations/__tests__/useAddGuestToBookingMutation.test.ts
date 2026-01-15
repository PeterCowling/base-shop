import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useAddGuestToBookingMutation from "../useAddGuestToBookingMutation";

/* eslint-disable no-var */
var mockDb: Record<string, unknown> = {};
var getMock: ReturnType<typeof vi.fn>;
var updateMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDb,
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

function buildMocks(overrides: { base?: Record<string, unknown> } = {}) {
  getMock.mockImplementation(async (path: string) => {
    if (path === "bookings/BR123/occ_old") {
      return {
        exists: () => true,
        val: () => ({
          checkInDate: "2024-01-01",
          checkOutDate: "2024-01-04",
          roomNumbers: ["3"],
          nights: 3,
          ...overrides.base,
        }),
      };
    }
    if (path === "guestsDetails/BR123/occ_old") {
      return {
        exists: () => true,
        val: () => ({ firstName: "Old", lastName: "Guest" }),
      };
    }
    if (path === "activities/occ_old") {
      return {
        exists: () => true,
        val: () => ({ act1: { code: 5, timestamp: "t" } }),
      };
    }
    if (path === "activitiesByCode") {
      return {
        exists: () => true,
        val: () => ({ 5: { occ_old: { act1: { code: 5, timestamp: "t" } } } }),
      };
    }
    if (path === "roomsByDate/2024-01-01/index_3/3") {
      return {
        exists: () => true,
        val: () => ({ guestIds: ["occ_old"] }),
      };
    }
    return { exists: () => false, val: () => null };
  });
}

vi.useFakeTimers();
vi.setSystemTime(new Date("2024-01-01T10:00:00Z"));

afterAll(() => {
  vi.useRealTimers();
});

describe("useAddGuestToBookingMutation", () => {
  beforeEach(() => {
    mockDb = {};
    getMock = vi.fn();
    updateMock = vi.fn();
    refMock = vi.fn((db: unknown, path?: string) => path ?? "");
    buildMocks();
  });

  it("writes replicated guest data to multiple paths", async () => {
    const { result } = renderHook(() => useAddGuestToBookingMutation());

    await act(async () => {
      await result.current.addReplicatedGuestToBooking("BR123", "occ_old", {
        firstName: "New",
      });
    });

    expect(updateMock).toHaveBeenCalled();
    const updates = updateMock.mock.calls[0][1];
    const newOccId = `occ_${Date.now()}`;
    const newActId = `act_${Date.now()}`;
    const expectedKeys = [
      `/bookings/BR123/${newOccId}`,
      `/guestsDetails/BR123/${newOccId}`,
      `/activities/${newOccId}/${newActId}`,
      `/activitiesByCode/5/${newOccId}/${newActId}`,
      `/cityTax/BR123/${newOccId}`,
      `/guestByRoom/${newOccId}`,
      `/roomsByDate/2024-01-01/index_3/3/guestIds`,
    ];
    expect(Object.keys(updates)).toEqual(expect.arrayContaining(expectedKeys));
    expect(updates[`/guestsDetails/BR123/${newOccId}`].firstName).toBe("New");
  });

  it("throws error when occupant record is missing", async () => {
    getMock.mockReset();
    getMock.mockImplementation(async (path: string) => {
      if (path === "bookings/BR123/occ_old") {
        return { exists: () => false };
      }
      return { exists: () => false, val: () => null };
    });
    const { result } = renderHook(() => useAddGuestToBookingMutation());

    await expect(
      result.current.addReplicatedGuestToBooking("BR123", "occ_old")
    ).rejects.toThrow("No occupant data found");
  });

  it("throws error when occupant data is incomplete", async () => {
    getMock.mockReset();
    buildMocks({ base: { checkInDate: undefined } });
    const { result } = renderHook(() => useAddGuestToBookingMutation());

    await expect(
      result.current.addReplicatedGuestToBooking("BR123", "occ_old")
    ).rejects.toThrow("Existing occupant data is incomplete");
  });
});
