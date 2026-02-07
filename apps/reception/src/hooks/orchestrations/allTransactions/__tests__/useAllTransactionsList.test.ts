import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import type { FinancialTransaction } from "../../../../types/hooks/data/allFinancialTransaction";
import useAllTransactionsList from "../useAllTransactionsList";
// The useFirebaseSubscription hook returns an object with `data`, `loading`
// and `error` keys. We replicate that shape here for the mock to avoid
// depending on a specific exported type from the hook implementation.
type MockFirebaseSubscriptionResult<T> = {
  data: T | null;
  loading: boolean;
  error: unknown | null;
};

let mockResult: MockFirebaseSubscriptionResult<
  Record<string, FinancialTransaction>
>;

jest.mock("../../../data/useFirebaseSubscription", () => ({
  default: () => mockResult,
}));

const txnRecords: Record<string, FinancialTransaction> = {
  txn1: {
    amount: 5,
    bookingRef: "BR1",
    count: 1,
    description: "A",
    itemCategory: "cat",
    method: "cash",
    occupantId: "occ1",
    timestamp: "2024-01-01",
    type: "sale",
    user_name: "bob",
  },
  txn2: {
    amount: 10,
    bookingRef: "BR2",
    count: 2,
    description: "B",
    itemCategory: "cat",
    method: "card",
    occupantId: "occ2",
    timestamp: "2024-01-02",
    type: "sale",
    user_name: "alice",
  },
};

describe("useAllTransactionsList", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("converts record map to array with txnId", () => {
    mockResult = { data: txnRecords, loading: false, error: null };

    const { result } = renderHook(() => useAllTransactionsList());

    expect(result.current.transactions).toEqual([
      { ...txnRecords.txn1, txnId: "txn1" },
      { ...txnRecords.txn2, txnId: "txn2" },
    ]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("propagates loading and error states", () => {
    const err = new Error("fail");
    mockResult = { data: null, loading: true, error: err };

    const { result } = renderHook(() => useAllTransactionsList());

    expect(result.current.transactions).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(err);
  });
});
