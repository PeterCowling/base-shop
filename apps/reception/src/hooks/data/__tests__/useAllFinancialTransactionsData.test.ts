import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useAllFinancialTransactionsData from "../useAllFinancialTransactionsData";

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let snapshotCb: ((snap: unknown) => void) | null = null;
let errorCb: ((err: unknown) => void) | null = null;

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  query: jest.fn((ref: unknown) => ref),
  orderByChild: jest.fn(() => undefined),
  startAt: jest.fn(() => undefined),
  endAt: jest.fn(() => undefined),
  limitToFirst: jest.fn(() => undefined),
  onValue: jest.fn(
    (
      _q: unknown,
      cb: (snap: unknown) => void,
      errCb?: (err: unknown) => void
    ) => {
      snapshotCb = cb;
      errorCb = errCb || null;
      return jest.fn();
    }
  ),
}));

afterEach(() => {
  jest.clearAllMocks();
  snapshotCb = null;
  errorCb = null;
});

describe("useAllFinancialTransactionsData", () => {
  it("parses valid transactions", () => {
    const { result } = renderHook(() => useAllFinancialTransactionsData());

    const txn = {
      amount: 10,
      bookingRef: "B1",
      count: 1,
      description: "desc",
      itemCategory: "Food",
      method: "cash",
      occupantId: "occ1",
      timestamp: "t",
      type: "sale",
      user_name: "user",
      isKeycard: true,
    };

    act(() => {
      snapshotCb?.({ exists: () => true, val: () => ({ tx1: txn }) });
    });

    expect(result.current.allFinancialTransactions).toEqual({ tx1: txn });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid transactions", () => {
    const { result } = renderHook(() => useAllFinancialTransactionsData());

    act(() => {
      if (errorCb) errorCb("fail");
    });

    expect(result.current.allFinancialTransactions).toEqual({});
    expect(result.current.error).toBe("fail");
  });

  it("skips invalid records but returns valid ones", () => {
    const { result } = renderHook(() => useAllFinancialTransactionsData());

    const valid = {
      amount: 10,
      bookingRef: "B1",
      count: 1,
      description: "desc",
      itemCategory: "Food",
      method: "cash",
      occupantId: "occ1",
      timestamp: "t",
      type: "sale",
      user_name: "user",
      isKeycard: true,
    };

    const invalid = { amount: 5 };

    act(() => {
      snapshotCb?.({
        exists: () => true,
        val: () => ({ tx1: valid, tx2: invalid }),
      });
    });

    expect(result.current.allFinancialTransactions).toEqual({ tx1: valid });
    expect(result.current.error).not.toBeNull();
  });
});
