import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useDeleteTransaction from "../useDeleteTransaction";

/* eslint-disable no-var */
var mockDb: unknown;
var refMock: ReturnType<typeof vi.fn>;
var getMock: ReturnType<typeof vi.fn>;
var updateMock: ReturnType<typeof vi.fn>;
var saveFinancialsRoomMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDb,
}));

vi.mock("../useFinancialsRoomMutations", () => ({
  default: () => ({ saveFinancialsRoom: saveFinancialsRoomMock }),
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
  mockDb = {};
  refMock = vi.fn((db: unknown, path?: string) => path ?? "");
  getMock = vi.fn();
  updateMock = vi.fn();
  saveFinancialsRoomMock = vi.fn();
});

describe("useDeleteTransaction", () => {
  it("removes transaction and updates financials room", async () => {
    const txnData = { bookingRef: "BR1", amount: 5 };
    const finData = { transactions: { txn1: txnData, other: { amount: 2 } } };
    getMock.mockImplementation(async (path: string) => {
      if (path === "allFinancialTransactions/txn1") return snap(txnData);
      if (path === "financialsRoom/BR1") return snap(finData);
      return snap(null);
    });

    const { result } = renderHook(() => useDeleteTransaction());

    await act(async () => {
      await result.current.deleteTransaction("txn1");
    });

    expect(updateMock).toHaveBeenCalledWith("", {
      "allFinancialTransactions/txn1": null,
    });
    expect(saveFinancialsRoomMock).toHaveBeenCalledWith("BR1", {
      transactions: { other: { amount: 2 } },
    });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("sets error when update fails", async () => {
    const txnData = { bookingRef: "BR2" };
    const err = new Error("fail");
    getMock.mockImplementation(async (path: string) => {
      if (path === "allFinancialTransactions/txn2") return snap(txnData);
      return snap(null);
    });
    updateMock.mockRejectedValue(err);

    const { result } = renderHook(() => useDeleteTransaction());

    await act(async () => {
      await expect(result.current.deleteTransaction("txn2")).rejects.toThrow(
        "fail"
      );
    });

    await waitFor(() => expect(result.current.error).toBe(err));
  });
});
