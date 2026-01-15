import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useDeleteGuestFromBooking from "../useDeleteGuestFromBooking";

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var updateMock: ReturnType<typeof vi.fn>;
var addActivityMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("../useActivitiesMutations", () => ({
  default: () => ({ addActivity: addActivityMock }),
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

function snap<T>(val: T) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

beforeEach(() => {
  database = {};
  refMock = vi.fn((_db: unknown, path?: string) => path ?? "");
  getMock = vi.fn();
  updateMock = vi.fn();
  addActivityMock = vi.fn();
});

describe("useDeleteGuestFromBooking", () => {
  it("removes occupant references and logs activity", async () => {
    getMock.mockImplementation(async (path: string) => {
      if (path === "bookings/BR1") {
        return snap({
          occ1: {
            checkInDate: "2024-01-01",
            checkOutDate: "2024-01-02",
            roomNumbers: ["3"],
          },
          other: {},
        });
      }
      if (path === "activitiesByCode") {
        return snap({ 5: { occ1: { a: 1 } } });
      }
      if (path === "roomByDate/2024-01-01/index_3/3") {
        return snap({ guestIds: ["occ1"] });
      }
      return snap(null);
    });

    const { result } = renderHook(() => useDeleteGuestFromBooking());

    await act(async () => {
      await result.current.deleteGuest({
        bookingRef: "BR1",
        occupantId: "occ1",
      });
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    const updates = updateMock.mock.calls[0][1];
    expect(updates).toEqual({
      "bookings/BR1/occ1": null,
      "cityTax/BR1/occ1": null,
      "completedTasks/occ1": null,
      "guestByRoom/occ1": null,
      "guestsByBooking/occ1": null,
      "guestsDetails/BR1/occ1": null,
      "preorder/occ1": null,
      "bagStorage/occ1": null,
      "activities/occ1": null,
      "activitiesByCode/5/occ1": null,
      "checkins/2024-01-01/occ1": null,
      "checkouts/2024-01-02/occ1": null,
      "roomByDate/2024-01-01/index_3/3/guestIds": null,
    });
    expect(addActivityMock).toHaveBeenCalledWith("occ1", 25);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when database is not initialized", async () => {
    database = null;
    const { result } = renderHook(() => useDeleteGuestFromBooking());

    await act(async () => {
      await result.current.deleteGuest({
        bookingRef: "BR1",
        occupantId: "occ1",
      });
    });

    expect(updateMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Database not initialized.");
    expect(result.current.loading).toBe(false);
  });
});
