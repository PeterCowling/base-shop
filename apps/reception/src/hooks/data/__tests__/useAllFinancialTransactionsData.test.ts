import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useAllFinancialTransactionsData from "../useAllFinancialTransactionsData";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let snapshotCb: ((snap: unknown) => void) | null = null;
let errorCb: ((err: unknown) => void) | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((ref: unknown) => ref),
  orderByChild: vi.fn(() => undefined),
  startAt: vi.fn(() => undefined),
  endAt: vi.fn(() => undefined),
  limitToFirst: vi.fn(() => undefined),
  onValue: vi.fn(
    (
      _q: unknown,
      cb: (snap: unknown) => void,
      errCb?: (err: unknown) => void
    ) => {
      snapshotCb = cb;
      errorCb = errCb || null;
      return vi.fn();
    }
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
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
      errorCb && errorCb("fail");
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
