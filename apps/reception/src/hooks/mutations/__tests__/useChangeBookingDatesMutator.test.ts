import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBookingDatesMutator } from "../useChangeBookingDatesMutator";

// mock firebase
let refMock: ReturnType<typeof vi.fn>;
let updateMock: ReturnType<typeof vi.fn>;
let removeMock: ReturnType<typeof vi.fn>;
let setMock: ReturnType<typeof vi.fn>;

vi.mock("firebase/database", () => ({
  getDatabase: () => ({}),
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
  remove: (...args: unknown[]) => removeMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

// auth context
vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));

// utils
let isoMock: ReturnType<typeof vi.fn>;
vi.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => isoMock(),
}));

let txnIdMock: ReturnType<typeof vi.fn>;
vi.mock("../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => txnIdMock(),
}));

let saveFinancialsRoomMock: ReturnType<typeof vi.fn>;
vi.mock("../useFinancialsRoomMutations", () => ({
  default: () => ({ saveFinancialsRoom: saveFinancialsRoomMock }),
}));

beforeEach(() => {
  refMock = vi.fn((_db: unknown, path?: string) => path ?? "");
  updateMock = vi.fn();
  removeMock = vi.fn();
  setMock = vi.fn();
  isoMock = vi.fn().mockReturnValue("2024-06-01T00:00:00.000Z");
  txnIdMock = vi
    .fn()
    .mockReturnValueOnce("txnA")
    .mockReturnValueOnce("txnB");
  saveFinancialsRoomMock = vi.fn();
});

describe("useBookingDatesMutator", () => {
  it("updates dates and records extension transactions", async () => {
    updateMock.mockResolvedValue(undefined);
    removeMock.mockResolvedValue(undefined);
    setMock.mockResolvedValue(undefined);
    saveFinancialsRoomMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBookingDatesMutator());

    await act(async () => {
      await result.current.updateBookingDates({
        bookingRef: "BR1",
        occupantId: "occ1",
        oldCheckIn: "2024-01-01",
        oldCheckOut: "2024-01-05",
        newCheckIn: "2024-01-02",
        newCheckOut: "2024-01-07",
        extendedPrice: "15",
      });
    });

    expect(updateMock).toHaveBeenCalledWith("bookings/BR1/occ1", {
      checkInDate: "2024-01-02",
      checkOutDate: "2024-01-07",
    });
    expect(removeMock).toHaveBeenCalledWith("checkins/2024-01-01/occ1");
    expect(removeMock).toHaveBeenCalledWith("checkouts/2024-01-05/occ1");
    expect(setMock).toHaveBeenCalledWith("checkins/2024-01-02/occ1", {
      reservationCode: "BR1",
      timestamp: "2024-06-01T00:00:00.000Z",
    });
    expect(setMock).toHaveBeenCalledWith("checkouts/2024-01-07/occ1", {
      reservationCode: "BR1",
      timestamp: "2024-06-01T00:00:00.000Z",
    });
    expect(saveFinancialsRoomMock).toHaveBeenCalledWith("BR1", {
      transactions: {
        txnA: {
          occupantId: "occ1",
          bookingRef: "BR1",
          amount: 15,
          nonRefundable: true,
          timestamp: "2024-06-01T00:00:00.000Z",
          type: "charge",
        },
        txnB: {
          occupantId: "occ1",
          bookingRef: "BR1",
          amount: 15,
          nonRefundable: true,
          timestamp: "2024-06-01T00:00:00.000Z",
          type: "payment",
        },
      },
    });
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when update fails", async () => {
    const err = new Error("fail");
    updateMock.mockRejectedValue(err);

    const { result } = renderHook(() => useBookingDatesMutator());

    await act(async () => {
      await result.current
        .updateBookingDates({
          bookingRef: "BR1",
          occupantId: "occ1",
          oldCheckIn: "2024-01-01",
          oldCheckOut: "2024-01-05",
          newCheckIn: "2024-01-01",
          newCheckOut: "2024-01-05",
        })
        .catch(() => null);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(err);
  });
});
