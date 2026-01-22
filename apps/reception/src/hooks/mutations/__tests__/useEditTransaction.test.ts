import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useEditTransaction from "../useEditTransaction";

/* eslint-disable no-var */
var database: unknown;
var getMock: jest.Mock;
var updateMock: jest.Mock;
var refMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("firebase/database", () => ({
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
  getMock = jest.fn();
  updateMock = jest.fn();
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
});

describe("useEditTransaction", () => {
  it("merges updates with existing transaction", async () => {
    const existing = {
      amount: 10,
      bookingRef: "BR",
      count: 1,
      description: "old",
      itemCategory: "cat",
      method: "cash",
      occupantId: "occ",
      timestamp: "t",
      type: "sale",
      user_name: "user",
    };
    getMock.mockResolvedValueOnce(snap(existing));

    const { result } = renderHook(() => useEditTransaction());

    await act(async () => {
      const p = result.current.editTransaction("txn1", {
        amount: 20,
        method: "card",
      });
      expect(result.current.loading).toBe(true);
      await p;
    });

    expect(updateMock).toHaveBeenCalledWith("", {
      "allFinancialTransactions/txn1": {
        ...existing,
        amount: 20,
        method: "card",
      },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when editTransaction update rejects", async () => {
    const existing: { amount: number } = { amount: 10 };
    getMock.mockResolvedValueOnce(snap(existing));
    const err = new Error("fail");
    updateMock.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useEditTransaction());

    await act(async () => {
      await expect(
        result.current.editTransaction("t1", { amount: 5 })
      ).rejects.toThrow("fail");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(err);
  });
});
