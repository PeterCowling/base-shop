import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useAddRoomPaymentTransaction from "../useAddRoomPaymentTransaction";

// Mock implementations for Firebase database methods. The variables are
// initialised before the `vi.mock` call so that Vitest's hoisting does not
// trigger a "Cannot access 'updateMock' before initialization" error.
const updateMock = jest.fn();
const refMock = jest.fn((..._args: unknown[]) => ({}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

jest.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

const addToAllTransactionsMock = jest.fn();
jest.mock("../../../mutations/useAllTransactionsMutations", () => ({
  default: () => ({ addToAllTransactions: addToAllTransactionsMock }),
}));

jest.mock("../../../../utils/generateTransactionId", () => ({
  generateTransactionId: () => "txn123",
}));

describe("useAddRoomPaymentTransaction", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    updateMock.mockReset();
    refMock.mockClear();
    addToAllTransactionsMock.mockReset();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("constructs update paths and transaction objects", async () => {
    const financialsRoom = {
      BR1: {
        balance: 50,
        totalDue: 150,
        totalPaid: 100,
        totalAdjust: 0,
        transactions: {},
      },
    };

    const { result } = renderHook(() =>
      useAddRoomPaymentTransaction(financialsRoom)
    );

    await act(async () => {
      await result.current.addPaymentTransaction("BR1", 50, {
        occupantId: "occ1",
      });
    });

    expect(refMock).toHaveBeenCalledWith({});
    expect(updateMock).toHaveBeenCalledTimes(1);
    const updates = updateMock.mock.calls[0][1];
    expect(updates).toEqual({
      "financialsRoom/BR1/transactions/txn123": {
        occupantId: "occ1",
        amount: 50,
        timestamp: expect.any(String),
        type: "payment",
        nonRefundable: true,
      },
      "financialsRoom/BR1/totalPaid": 150,
      "financialsRoom/BR1/balance": 0,
    });

    expect(addToAllTransactionsMock).toHaveBeenCalledWith("txn123", {
      bookingRef: "BR1",
      occupantId: "occ1",
      amount: 50,
      type: "payment",
      method: "CC",
      itemCategory: "roomCharge",
      count: 1,
      nonRefundable: true,
      docType: "",
      description: "Room payment",
      user_name: "Pete",
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error when addPaymentTransaction update rejects", async () => {
    const err = new Error("fail");
    updateMock.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAddRoomPaymentTransaction(null));

    await act(async () => {
      await expect(
        result.current.addPaymentTransaction("BR2", 10)
      ).rejects.toThrow("fail");
    });

    expect(result.current.error).toBe(err);
    expect(addToAllTransactionsMock).not.toHaveBeenCalled();
  });
});
