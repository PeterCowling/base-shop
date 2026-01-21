import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import React from "react";

import type { CreditSlip } from "../../types/component/Till";
import type { FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import type { CashCount } from "../../types/hooks/data/cashCountData";
import { TillDataProvider, useTillData } from "../TillDataContext";

const baseRecord = {
  user: "tester",
  count: 0,
  difference: 0,
};

let mockCashCounts: CashCount[] = [];
let mockCreditSlips: CreditSlip[] = [];
let mockTransactions: Record<string, FinancialTransaction> = {};
const mockUseAllFinancialTransactionsData = jest.fn();

jest.mock("../../hooks/data/useCashCountsData", () => ({
  useCashCountsData: () => ({
    cashCounts: mockCashCounts,
    loading: false,
    error: null,
  }),
}));
jest.mock("../../hooks/data/till/useCreditSlipsData", () => ({
  useCreditSlipsData: () => ({
    creditSlips: mockCreditSlips,
    loading: false,
    error: null,
  }),
}));
jest.mock("../../hooks/data/useAllFinancialTransactionsData", () => ({
  default: (params?: unknown) =>
    mockUseAllFinancialTransactionsData(params),
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TillDataProvider>{children}</TillDataProvider>
);


describe("useTillData", () => {
  let consoleErrorSpy: jest.SpyInstance | undefined;
  let consoleDebugSpy: jest.SpyInstance | undefined;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
    consoleDebugSpy?.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCashCounts = [];
    mockCreditSlips = [];
    mockTransactions = {};
    mockUseAllFinancialTransactionsData.mockImplementation((params?: {
      startAt?: string;
      endAt?: string;
      skip?: boolean;
    }) => {
      let txns = mockTransactions;
      if (params && !params.skip && (params.startAt || params.endAt)) {
        txns = Object.fromEntries(
          Object.entries(mockTransactions).filter(([, t]) => {
            if (params.startAt && t.timestamp < params.startAt) return false;
            if (params.endAt && t.timestamp > params.endAt) return false;
            return true;
          })
        );
      }
      return {
        allFinancialTransactions: txns,
        loading: false,
        error: null,
      };
    });
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useTillData())).toThrow(
      "useTillData must be used within a TillDataProvider"
    );
  });

  it("returns mapped transactions", () => {
    mockTransactions = {
      tx1: {
        amount: 5,
        bookingRef: "B1",
        count: 1,
        description: "A",
        itemCategory: "cat",
        method: "cash",
        occupantId: "occ1",
        timestamp: "2024-01-01",
        type: "sale",
        user_name: "bob",
      },
      tx2: {
        amount: 10,
        bookingRef: "B2",
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

    const { result } = renderHook(() => useTillData(), { wrapper });

    expect(result.current.transactions).toEqual([
      { ...mockTransactions.tx1, txnId: "tx1" },
      { ...mockTransactions.tx2, txnId: "tx2" },
    ]);
  });

  it("queries by provided reportDate when supplied", () => {
    const reportDate = new Date("2024-01-01T00:00:00Z");
    renderHook(() => useTillData(), {
      wrapper: ({ children }) => (
        <TillDataProvider reportDate={reportDate}>{children}</TillDataProvider>
      ),
    });

    expect(mockUseAllFinancialTransactionsData).toHaveBeenCalledWith(
      expect.objectContaining({
        orderByChild: "timestamp",
        startAt: "2024-01-01T00:00:00.000+00:00",
        endAt: "2024-01-01T23:59:59.999+00:00",
      })
    );
  });

  it("handles Italian day boundaries when filtering transactions", () => {
    const reportDate = new Date("2024-01-02T00:00:00Z");
    mockTransactions = {
      prev: {
        amount: 1,
        bookingRef: "Bprev",
        count: 1,
        description: "prev",
        itemCategory: "cat",
        method: "cash",
        occupantId: "occ",
        timestamp: "2024-01-01T23:30:00.000+00:00",
        type: "sale",
        user_name: "bob",
      },
      curr: {
        amount: 2,
        bookingRef: "Bcurr",
        count: 1,
        description: "curr",
        itemCategory: "cat",
        method: "cash",
        occupantId: "occ",
        timestamp: "2024-01-02T00:30:00.000+00:00",
        type: "sale",
        user_name: "alice",
      },
    };

    const { result } = renderHook(() => useTillData(), {
      wrapper: ({ children }) => (
        <TillDataProvider reportDate={reportDate}>{children}</TillDataProvider>
      ),
    });

    expect(result.current.transactions).toEqual([
      { ...mockTransactions.curr, txnId: "curr" },
    ]);
  });

  it("filters cashCounts by reportDate when supplied", () => {
    const first = {
      ...baseRecord,
      type: "opening" as const,
      timestamp: "2024-01-01T08:00:00.000+00:00",
    };
    const second = {
      ...baseRecord,
      type: "opening" as const,
      timestamp: "2024-01-02T08:00:00.000+00:00",
    };
    mockCashCounts = [first, second];
    const reportDate = new Date("2024-01-01T00:00:00Z");

    const { result } = renderHook(() => useTillData(), {
      wrapper: ({ children }) => (
        <TillDataProvider reportDate={reportDate}>{children}</TillDataProvider>
      ),
    });

    expect(result.current.cashCounts).toEqual([first]);
  });

  it("sets isShiftOpen true when unmatched opening exists for reportDate", () => {
    mockCashCounts = [
      {
        ...baseRecord,
        type: "opening",
        timestamp: "2024-01-01T08:00:00.000+00:00",
      },
    ];
    const reportDate = new Date("2024-01-01T00:00:00Z");

    const { result } = renderHook(() => useTillData(), {
      wrapper: ({ children }) => (
        <TillDataProvider reportDate={reportDate}>{children}</TillDataProvider>
      ),
    });

    expect(result.current.isShiftOpen).toBe(true);
  });

  it("sets isShiftOpen false when reportDate has no unmatched opening", () => {
    mockCashCounts = [
      {
        ...baseRecord,
        type: "opening",
        timestamp: "2024-01-02T08:00:00.000+00:00",
      },
    ];
    const reportDate = new Date("2024-01-01T00:00:00Z");

    const { result } = renderHook(() => useTillData(), {
      wrapper: ({ children }) => (
        <TillDataProvider reportDate={reportDate}>{children}</TillDataProvider>
      ),
    });

    expect(result.current.isShiftOpen).toBe(false);
  });
});
