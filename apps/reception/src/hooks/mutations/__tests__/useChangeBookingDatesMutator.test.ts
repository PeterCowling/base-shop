import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useBookingDatesMutator } from "../useChangeBookingDatesMutator";

// mock firebase
let refMock: jest.Mock;
let updateMock: jest.Mock;

jest.mock("firebase/database", () => ({
  getDatabase: () => ({}),
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

// auth context
jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));

// utils
let isoMock: jest.Mock;
jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => isoMock(),
}));

let txnIdMock: jest.Mock;
jest.mock("../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => txnIdMock(),
}));

let saveFinancialsRoomMock: jest.Mock;
jest.mock("../useFinancialsRoomMutations", () => ({
  default: () => ({ saveFinancialsRoom: saveFinancialsRoomMock }),
}));

let useOnlineStatusMock: jest.Mock;
jest.mock("../../../lib/offline/useOnlineStatus", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

beforeEach(() => {
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
  updateMock = jest.fn();
  isoMock = jest.fn().mockReturnValue("2024-06-01T00:00:00.000Z");
  txnIdMock = jest
    .fn()
    .mockReturnValueOnce("txnA")
    .mockReturnValueOnce("txnB");
  saveFinancialsRoomMock = jest.fn();
  useOnlineStatusMock = jest.fn().mockReturnValue(true);
  jest
    .spyOn(globalThis.crypto, "randomUUID")
    .mockReturnValueOnce("uuid-1")
    .mockReturnValueOnce("uuid-2");
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useBookingDatesMutator", () => {
  it("updates dates with one atomic multipath write and records extension transactions", async () => {
    updateMock.mockResolvedValue(undefined);
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

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        "bookings/BR1/occ1/checkInDate": "2024-01-02",
        "bookings/BR1/occ1/checkOutDate": "2024-01-07",
        "checkins/2024-01-01/occ1": null,
        "checkins/2024-01-02/occ1": {
          reservationCode: "BR1",
          timestamp: "2024-06-01T00:00:00.000Z",
        },
        "checkouts/2024-01-05/occ1": null,
        "checkouts/2024-01-07/occ1": {
          reservationCode: "BR1",
          timestamp: "2024-06-01T00:00:00.000Z",
        },
        "activities/occ1/act_uuid-1": {
          code: 19,
          timestamp: "2024-06-01T00:00:00.000Z",
          who: "Tester",
        },
        "activitiesByCode/19/occ1/act_uuid-1": {
          timestamp: "2024-06-01T00:00:00.000Z",
          who: "Tester",
        },
        "activities/occ1/act_uuid-2": {
          code: 24,
          timestamp: "2024-06-01T00:00:00.000Z",
          who: "Tester",
        },
        "activitiesByCode/24/occ1/act_uuid-2": {
          timestamp: "2024-06-01T00:00:00.000Z",
          who: "Tester",
        },
      })
    );
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
    expect(
      saveFinancialsRoomMock.mock.invocationCallOrder[0]
    ).toBeLessThan(updateMock.mock.invocationCallOrder[0]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("voids extension financial transactions if booking mutation fails after financial write", async () => {
    isoMock = jest
      .fn()
      .mockReturnValueOnce("2024-06-01T00:00:00.000Z")
      .mockReturnValueOnce("2024-06-01T00:01:00.000Z");
    saveFinancialsRoomMock.mockResolvedValue(undefined);
    updateMock.mockRejectedValue(new Error("core update failed"));

    const { result } = renderHook(() => useBookingDatesMutator());

    await act(async () => {
      await expect(
        result.current.updateBookingDates({
          bookingRef: "BR1",
          occupantId: "occ1",
          oldCheckIn: "2024-01-01",
          oldCheckOut: "2024-01-05",
          newCheckIn: "2024-01-02",
          newCheckOut: "2024-01-07",
          extendedPrice: "15",
        })
      ).rejects.toThrow("core update failed");
    });

    expect(saveFinancialsRoomMock).toHaveBeenCalledTimes(2);
    expect(saveFinancialsRoomMock).toHaveBeenNthCalledWith(1, "BR1", {
      transactions: {
        txnA: expect.objectContaining({ type: "charge", amount: 15 }),
        txnB: expect.objectContaining({ type: "payment", amount: 15 }),
      },
    });
    expect(saveFinancialsRoomMock).toHaveBeenNthCalledWith(2, "BR1", {
      transactions: {
        txnA: expect.objectContaining({
          voidedAt: "2024-06-01T00:01:00.000Z",
          voidedBy: "Tester",
          voidReason: "booking-date-update-failed",
        }),
        txnB: expect.objectContaining({
          voidedAt: "2024-06-01T00:01:00.000Z",
          voidedBy: "Tester",
          voidReason: "booking-date-update-failed",
        }),
      },
    });
  });

  it("throws and sets error when multipath update fails", async () => {
    const err = new Error("fail");
    updateMock.mockRejectedValue(err);

    const { result } = renderHook(() => useBookingDatesMutator());

    await act(async () => {
      await expect(
        result.current.updateBookingDates({
          bookingRef: "BR1",
          occupantId: "occ1",
          oldCheckIn: "2024-01-01",
          oldCheckOut: "2024-01-05",
          newCheckIn: "2024-01-01",
          newCheckOut: "2024-01-05",
        })
      ).rejects.toThrow("fail");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(err);
  });

  it("fails closed when offline and does not write", async () => {
    useOnlineStatusMock.mockReturnValue(false);
    const { result } = renderHook(() => useBookingDatesMutator());

    await act(async () => {
      await expect(
        result.current.updateBookingDates({
          bookingRef: "BR1",
          occupantId: "occ1",
          oldCheckIn: "2024-01-01",
          oldCheckOut: "2024-01-05",
          newCheckIn: "2024-01-01",
          newCheckOut: "2024-01-05",
        })
      ).rejects.toThrow(/network connection/i);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
