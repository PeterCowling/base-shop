import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useShiftCalculations } from "../useShiftCalculations";
import type { Transaction, CreditSlip } from "../../../../types/component/Till";
import type { CashCount } from "../../../../types/hooks/data/cashCountData";
import type { SafeCount } from "../../../../types/hooks/data/safeCountData";

const shiftOpen = new Date("2023-01-01T10:00:00Z");

const transactions: Transaction[] = [
  { txnId: "t1", timestamp: "2023-01-01T11:00:00Z", amount: 50, method: "CASH", type: "Sale" },
  { txnId: "t2", timestamp: "2023-01-01T12:00:00Z", amount: -20, method: "CASH", type: "Refund" },
  { txnId: "t3", timestamp: "2023-01-01T13:00:00Z", amount: 30, method: "CC", type: "Sale" },
  { txnId: "t4", timestamp: "2022-12-31T23:00:00Z", amount: 40, method: "CC", type: "Sale" },
];

const creditSlips: CreditSlip[] = [
  { slipNumber: "s1", timestamp: "2023-01-01T11:30:00Z", amount: 5, user: "u" },
  { slipNumber: "s0", timestamp: "2022-12-31T23:59:00Z", amount: 3, user: "u" },
];

const baseParams = {
  transactions,
  creditSlips,
  shiftOpenTime: shiftOpen,
  previousShiftCloseTime: new Date("2022-12-31T22:00:00Z"),
  openingCash: 100,
  openingKeycards: 0,
  finalCashCount: 0,
  cashDrawerLimit: 200,
};

describe("useShiftCalculations", () => {
  it("ignores safe withdrawal when float entry exists", () => {
    const cashCounts: CashCount[] = [
      { user: "u", timestamp: "2023-01-01T10:15:00Z", type: "float", amount: 10 },
    ];

    const safeCounts: SafeCount[] = [
      {
        id: "1",
        user: "u",
        timestamp: "2023-01-01T10:15:00Z",
        type: "withdrawal",
        amount: 10,
      },
    ];

    const { result } = renderHook(() =>
      useShiftCalculations({ ...baseParams, cashCounts, safeCounts })
    );

    expect(result.current.floatEntryTotal).toBe(10);
    expect(result.current.safeWithdrawalTotal).toBe(10);
    expect(result.current.expectedCashAtClose).toBe(135);
  });

  it("ignores safe deposit when tender removal exists", () => {
    const cashCounts: CashCount[] = [
      { user: "u", timestamp: "2023-01-01T14:00:00Z", type: "tenderRemoval", amount: 15 },
    ];

    const safeCounts: SafeCount[] = [
      {
        id: "1",
        user: "u",
        timestamp: "2023-01-01T14:00:00Z",
        type: "deposit",
        amount: 15,
      },
    ];

    const { result } = renderHook(() =>
      useShiftCalculations({ ...baseParams, cashCounts, safeCounts })
    );

    expect(result.current.tenderRemovalTotal).toBe(15);
    expect(result.current.safeDepositTotal).toBe(15);
    expect(result.current.expectedCashAtClose).toBe(110);
  });

  it("includes safe-only deposits and withdrawals when no cash counts exist", () => {
    const cashCounts: CashCount[] = [];

    const safeCounts: SafeCount[] = [
      {
        id: "1",
        user: "u",
        timestamp: "2023-01-01T15:00:00Z",
        type: "withdrawal",
        amount: 20,
      },
      {
        id: "2",
        user: "u",
        timestamp: "2023-01-01T16:00:00Z",
        type: "deposit",
        amount: 5,
      },
      {
        id: "3",
        user: "u",
        timestamp: "2023-01-01T17:00:00Z",
        type: "bankDeposit",
        amount: 50,
      },
      {
        id: "4",
        user: "u",
        timestamp: "2023-01-01T18:00:00Z",
        type: "bankWithdrawal",
        amount: 40,
      },
    ];

    const { result } = renderHook(() =>
      useShiftCalculations({ ...baseParams, cashCounts, safeCounts })
    );

    expect(result.current.safeWithdrawalTotal).toBe(20);
    expect(result.current.safeDepositTotal).toBe(5);
    expect(result.current.expectedCashAtClose).toBe(140);
  });

  it("derives keycard loan and return counts from the isKeycard flag", () => {
    const keycardTxns: Transaction[] = [
      {
        txnId: "k1",
        timestamp: "2023-01-01T12:30:00Z",
        amount: 0,
        type: "Loan",
        count: 2,
        isKeycard: true,
      },
      {
        txnId: "k2",
        timestamp: "2023-01-01T13:30:00Z",
        amount: 0,
        type: "Refund",
        count: 1,
        isKeycard: true,
      },
      {
        txnId: "k3",
        timestamp: "2023-01-01T14:30:00Z",
        amount: 0,
        type: "Loan",
        count: 5,
      },
    ];

    const { result } = renderHook(() =>
      useShiftCalculations({
        ...baseParams,
        transactions: keycardTxns,
        creditSlips: [],
        cashCounts: [],
        safeCounts: [],
      })
    );

    expect(result.current.keycardsLoaned).toBe(2);
    expect(result.current.keycardsReturned).toBe(1);
  });
});

