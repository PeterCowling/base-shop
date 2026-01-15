import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useDeleteBooking from "../useDeleteBooking";

/* eslint-disable no-var */
var database: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var deleteGuestMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("../useDeleteGuestFromBooking", () => ({
  default: () => ({ deleteGuest: deleteGuestMock }),
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
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
  deleteGuestMock = vi.fn();
});

describe("useDeleteBooking", () => {
  it("calls deleteGuest for each occupant", async () => {
    getMock.mockResolvedValueOnce(snap({ occ1: {}, occ2: {} }));

    const { result } = renderHook(() => useDeleteBooking());

    await act(async () => {
      await result.current.deleteBooking("BR1");
    });

    expect(deleteGuestMock).toHaveBeenCalledTimes(2);
    expect(deleteGuestMock).toHaveBeenNthCalledWith(1, {
      bookingRef: "BR1",
      occupantId: "occ1",
    });
    expect(deleteGuestMock).toHaveBeenNthCalledWith(2, {
      bookingRef: "BR1",
      occupantId: "occ2",
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when database is not initialized", async () => {
    database = null;
    const { result } = renderHook(() => useDeleteBooking());

    await act(async () => {
      await result.current.deleteBooking("BR1");
    });

    expect(deleteGuestMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Database not initialized.");
    expect(result.current.loading).toBe(false);
  });

  it("sets error when get rejects", async () => {
    const err = new Error("fail");
    getMock.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useDeleteBooking());

    await act(async () => {
      await expect(result.current.deleteBooking("BR1")).rejects.toThrow("fail");
    });

    await waitFor(() => expect(result.current.error).toBe(err));
  });
});
