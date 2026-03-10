import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useFinancialsRoomMutations from "../useFinancialsRoomMutations";

/* eslint-disable no-var */
var database: unknown;
var refMock: jest.Mock;
var runTransactionMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
}));

beforeEach(() => {
  database = {};
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
  runTransactionMock = jest.fn();
});

describe("useFinancialsRoomMutations", () => {
  it("merges data in transaction callback and recalculates totals", async () => {
    const existing = {
      balance: 0,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {
        t1: { type: "charge", amount: 50, timestamp: "", nonRefundable: false },
      },
    };
    let transactionPayload: unknown = null;
    runTransactionMock.mockImplementation(
      async (_nodeRef: unknown, updater: (current: unknown) => unknown) => {
        transactionPayload = updater(existing);
        return {
          committed: true,
          snapshot: { val: () => transactionPayload },
        };
      }
    );

    const { result } = renderHook(() => useFinancialsRoomMutations());

    await act(async () => {
      await result.current.saveFinancialsRoom("BR1", {
        transactions: {
          t2: { type: "payment", amount: 20, timestamp: "", nonRefundable: false },
        },
      });
    });

    expect(refMock).toHaveBeenCalledWith(database, "financialsRoom/BR1");
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
    expect(transactionPayload).toEqual({
      balance: 30,
      totalDue: 50,
      totalPaid: 20,
      totalAdjust: 0,
      transactions: {
        t1: { type: "charge", amount: 50, timestamp: "", nonRefundable: false },
        t2: { type: "payment", amount: 20, timestamp: "", nonRefundable: false },
      },
    });
    expect(result.current.error).toBeNull();
  });

  it("rejects when database missing", async () => {
    database = null;
    const { result } = renderHook(() => useFinancialsRoomMutations());
    await act(async () => {
      await expect(
        result.current.saveFinancialsRoom("BR1", {})
      ).rejects.toThrow("Firebase database is not initialized.");
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("sets error when transaction fails", async () => {
    runTransactionMock.mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useFinancialsRoomMutations());

    await act(async () => {
      await expect(
        result.current.saveFinancialsRoom("BR1", {})
      ).rejects.toThrow("fail");
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("rejects when transaction is not committed", async () => {
    runTransactionMock.mockResolvedValue({ committed: false });
    const { result } = renderHook(() => useFinancialsRoomMutations());

    await act(async () => {
      await expect(
        result.current.saveFinancialsRoom("BR1", {})
      ).rejects.toThrow("Financials transaction was not committed");
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
