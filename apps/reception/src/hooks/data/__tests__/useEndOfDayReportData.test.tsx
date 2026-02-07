import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { SafeDataProvider } from "../../../context/SafeDataContext";
import type { CardIrregularity } from "../../../types/hooks/data/cardIrregularityData";
import type { CashDiscrepancy } from "../../../types/hooks/data/cashDiscrepancyData";
import type { KeycardDiscrepancy } from "../../../types/hooks/data/keycardDiscrepancyData";
import { useEndOfDayReportData } from "../useEndOfDayReportData";

const mockUseTillData = jest.fn();
const mockUseCashDiscrepanciesData = jest.fn();
const mockUseKeycardDiscrepanciesData = jest.fn();
const mockUseCCIrregularitiesData = jest.fn();
const mockUseSafeLogic = jest.fn();
const mockGetSafeBalanceAt = jest.fn();
const mockUseKeycardTransfersData = jest.fn();

jest.mock("../../../context/TillDataContext", () => ({
  useTillData: () => mockUseTillData(),
}));

jest.mock("../useCashDiscrepanciesData", () => ({
  useCashDiscrepanciesData: () => mockUseCashDiscrepanciesData(),
}));

jest.mock("../useKeycardDiscrepanciesData", () => ({
  useKeycardDiscrepanciesData: () => mockUseKeycardDiscrepanciesData(),
}));

jest.mock("../useKeycardTransfersData", () => ({
  useKeycardTransfersData: () => mockUseKeycardTransfersData(),
}));

jest.mock("../useCCIrregularitiesData", () => ({
  useCCIrregularitiesData: () => mockUseCCIrregularitiesData(),
}));

jest.mock("../../useSafeLogic", () => ({
  useSafeLogic: () => mockUseSafeLogic(),
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeDataProvider>{children}</SafeDataProvider>
);

const setupDefaultMocks = () => {
  mockUseTillData.mockReturnValue({
    transactions: [],
    cashCounts: [],
    creditSlips: [],
    loading: false,
    error: null,
  });
  mockUseCashDiscrepanciesData.mockReturnValue({
    cashDiscrepancies: [] as CashDiscrepancy[],
    loading: false,
    error: null,
  });
  mockUseKeycardDiscrepanciesData.mockReturnValue({
    keycardDiscrepancies: [] as KeycardDiscrepancy[],
    loading: false,
    error: null,
  });
  mockUseCCIrregularitiesData.mockReturnValue({
    ccIrregularities: [] as CardIrregularity[],
    loading: false,
    error: null,
  });
  mockUseKeycardTransfersData.mockReturnValue({
    transfers: [],
    loading: false,
    error: null,
  });
  mockUseSafeLogic.mockReturnValue({
    safeCounts: [],
    getSafeBalanceAt: mockGetSafeBalanceAt,
    loading: false,
    error: null,
  });
  mockGetSafeBalanceAt.mockReset();
  mockGetSafeBalanceAt.mockReturnValue(0);
};

describe("useEndOfDayReportData - cash", () => {
  beforeEach(setupDefaultMocks);

  it("calculates expected closing cash and variance", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        { method: "cash", amount: 100, timestamp: "2024-01-01T10:00:00Z" },
      ],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T00:00:00Z", type: "opening", count: 200 },
        { user: "u", timestamp: "2024-01-01T15:00:00Z", type: "tenderRemoval", amount: 30 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", count: 270 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );
    expect(result.current.expectedCash).toBeCloseTo(270);
    expect(result.current.variance).toBeCloseTo(0);
  });

  it("accounts for safe exchanges in expected cash", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T00:00:00Z", type: "opening", count: 100 },
        {
          user: "u",
          timestamp: "2024-01-01T10:30:00Z",
          type: "tenderRemoval",
          amount: 20,
        },
        {
          user: "u",
          timestamp: "2024-01-01T10:30:01Z",
          type: "float",
          amount: 20,
        },
        {
          user: "u",
          timestamp: "2024-01-01T12:30:00Z",
          type: "tenderRemoval",
          amount: 30,
        },
        {
          user: "u",
          timestamp: "2024-01-01T12:30:01Z",
          type: "float",
          amount: 30,
        },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", count: 100 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T10:00:00Z",
          type: "exchange",
          amount: 20,
          direction: "drawerToSafe",
        },
        {
          user: "s",
          timestamp: "2024-01-01T12:00:00Z",
          type: "exchange",
          amount: 30,
          direction: "safeToDrawer",
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.drawerToSafeExchangesTotal).toBe(20);
    expect(result.current.safeToDrawerExchangesTotal).toBe(30);
    expect(result.current.expectedCash).toBeCloseTo(100);
    expect(result.current.variance).toBeCloseTo(0);
  });

  it("uses earliest opening and latest closing counts", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T09:00:00Z", type: "opening", count: 200 },
        { user: "u", timestamp: "2024-01-01T08:00:00Z", type: "opening", count: 100 },
        { user: "u", timestamp: "2024-01-01T19:00:00Z", type: "close", count: 300 },
        { user: "u", timestamp: "2024-01-01T20:00:00Z", type: "close", count: 400 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.openingCash).toBe(100);
    expect(result.current.closingCash).toBe(400);
    expect(result.current.expectedCash).toBe(100);
    expect(result.current.variance).toBe(300);
  });

  it("sums payment methods case-insensitively", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        { method: "cash", amount: 10, timestamp: "2024-01-01T10:00:00Z" },
        { method: "CASH", amount: 20, timestamp: "2024-01-01T11:00:00Z" },
        { method: "Card", amount: 30, timestamp: "2024-01-01T12:00:00Z" },
        { method: "CARD", amount: 40, timestamp: "2024-01-01T13:00:00Z" },
        { method: "Voucher", amount: 50, timestamp: "2024-01-01T14:00:00Z" },
      ],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.totals.cash).toBe(30);
    expect(result.current.totals.card).toBe(70);
    expect(result.current.totals.other).toBe(50);
  });

  it("excludes voided transactions from totals", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        { method: "cash", amount: 10, timestamp: "2024-01-01T10:00:00Z" },
        {
          method: "cash",
          amount: 25,
          timestamp: "2024-01-01T11:00:00Z",
          voidedAt: "2024-01-01T11:05:00Z",
          voidReason: "Mistake",
        },
        {
          method: "card",
          amount: 30,
          timestamp: "2024-01-01T12:00:00Z",
          voidedBy: "u",
        },
        { method: "voucher", amount: 40, timestamp: "2024-01-01T13:00:00Z" },
      ],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.totals.cash).toBe(10);
    expect(result.current.totals.card).toBe(0);
    expect(result.current.totals.other).toBe(40);
  });

  it("summarizes corrections for the report date", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        {
          amount: -10,
          timestamp: "2024-01-01T09:00:00Z",
          correctionKind: "reversal",
          sourceTxnId: "txn-1",
        },
        {
          amount: 12,
          timestamp: "2024-01-01T09:05:00Z",
          correctionKind: "replacement",
          sourceTxnId: "txn-1",
        },
        {
          amount: -2,
          timestamp: "2024-01-01T09:10:00Z",
          correctionKind: "adjustment",
          sourceTxnId: "txn-2",
        },
        {
          amount: 5,
          timestamp: "2024-01-02T09:10:00Z",
          correctionKind: "replacement",
          sourceTxnId: "txn-3",
        },
        {
          amount: 7,
          timestamp: "2024-01-01T09:20:00Z",
          correctionKind: "replacement",
          sourceTxnId: "txn-4",
          voidedAt: "2024-01-01T09:21:00Z",
        },
      ],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.correctionSummary.total).toBe(3);
    expect(result.current.correctionSummary.netAmount).toBe(0);
    expect(result.current.correctionSummary.reversalCount).toBe(1);
    expect(result.current.correctionSummary.replacementCount).toBe(1);
    expect(result.current.correctionSummary.adjustmentCount).toBe(1);
  });

  it("ignores voided keycard loans in expected keycards", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        {
          type: "Loan",
          isKeycard: true,
          count: 1,
          timestamp: "2024-01-01T10:00:00Z",
        },
        {
          type: "Loan",
          isKeycard: true,
          count: 2,
          timestamp: "2024-01-01T10:30:00Z",
          voidedAt: "2024-01-01T10:35:00Z",
        },
      ],
      cashCounts: [
        {
          user: "u",
          timestamp: "2024-01-01T00:00:00Z",
          type: "opening",
          keycardCount: 5,
        },
        {
          user: "u",
          timestamp: "2024-01-01T22:00:00Z",
          type: "close",
          keycardCount: 4,
        },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.expectedKeycards).toBe(4);
    expect(result.current.keycardVariance).toBe(0);
  });

  it("includes only records on the report date around midnight", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        {
          method: "cash",
          amount: 10,
          timestamp: "2024-01-01T22:59:00Z", // 23:59 in Italy on Jan 1
        },
        {
          method: "cash",
          amount: 20,
          timestamp: "2024-01-01T23:01:00Z", // 00:01 in Italy on Jan 2
        },
      ],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T22:59:00Z", // 23:59 in Italy on Jan 1
          type: "deposit",
          amount: 100,
        },
        {
          user: "s",
          timestamp: "2024-01-01T23:01:00Z", // 00:01 in Italy on Jan 2
          type: "deposit",
          amount: 200,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result: resultDay1, unmount } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );
    expect(resultDay1.current.totals.cash).toBe(10);
    expect(resultDay1.current.deposits.total).toBe(100);
    unmount();

    const { result: resultDay2 } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-02T00:00:00Z")),
      { wrapper }
    );
    expect(resultDay2.current.totals.cash).toBe(20);
    expect(resultDay2.current.deposits.total).toBe(200);
  });

  it("handles safe resets around midnight correctly", () => {
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T23:30:00Z", // 00:30 in Italy on Jan 2
          type: "safeReset",
          keycardDifference: 1,
        },
        {
          user: "s",
          timestamp: "2024-01-02T23:30:00Z", // 00:30 in Italy on Jan 3
          type: "safeReset",
          keycardDifference: 2,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-02T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.keycardReconcileAdjustment).toBe(1);
    expect(result.current.todaysSafeResets).toHaveLength(1);
    expect(result.current.todaysSafeResets[0].keycardDifference).toBe(1);
  });

  it("flags safe inflows mismatch when tender removals differ from safe inflows", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T00:00:00Z", type: "opening", count: 100 },
        { user: "u", timestamp: "2024-01-01T10:00:00Z", type: "tenderRemoval", amount: 40 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", count: 60 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockGetSafeBalanceAt.mockReset();
    mockGetSafeBalanceAt
      .mockReturnValueOnce(500)
      .mockReturnValueOnce(600);
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        { user: "s", timestamp: "2024-01-01T11:00:00Z", type: "bankWithdrawal", amount: 30 },
        { user: "s", timestamp: "2024-01-01T12:00:00Z", type: "deposit", amount: 50 },
        {
          user: "s",
          timestamp: "2024-01-01T13:00:00Z",
          type: "exchange",
          amount: 20,
          direction: "drawerToSafe",
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

      expect(result.current.safeInflowsTotal).toBe(80);
      expect(result.current.tenderRemovalTotal).toBe(40);
      expect(result.current.safeInflowsMismatch).toBe(true);
    });

    it("flags safe variance mismatch when expected safe variance differs from actual", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T00:00:00Z", type: "opening", count: 10 },
        { user: "u", timestamp: "2024-01-01T09:00:00Z", type: "tenderRemoval", amount: 10 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", count: 0 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockGetSafeBalanceAt.mockReset();
      mockGetSafeBalanceAt
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(120);
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        { user: "s", timestamp: "2024-01-01T07:00:00Z", type: "bankWithdrawal", amount: 5 },
        { user: "s", timestamp: "2024-01-01T08:00:00Z", type: "deposit", amount: 10 },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

      expect(result.current.safeInflowsTotal).toBe(15);
      expect(result.current.expectedSafeVariance).toBe(15);
      expect(result.current.safeVariance).toBe(20);
      expect(result.current.safeVarianceMismatch).toBe(true);
      expect(result.current.safeInflowsMismatch).toBe(false);
    });

  it("calculates expected cash with tender removals and safe exchanges", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        { method: "cash", amount: 50, timestamp: "2024-01-01T10:00:00Z" },
      ],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T00:00:00Z", type: "opening", count: 100 },
        { user: "u", timestamp: "2024-01-01T14:00:00Z", type: "tenderRemoval", amount: 10 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", count: 130 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T08:00:00Z",
          type: "exchange",
          amount: 20,
          direction: "drawerToSafe",
        },
        {
          user: "s",
          timestamp: "2024-01-01T09:00:00Z",
          type: "exchange",
          amount: 10,
          direction: "safeToDrawer",
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.drawerToSafeExchangesTotal).toBe(20);
    expect(result.current.safeToDrawerExchangesTotal).toBe(10);
    expect(result.current.expectedCash).toBeCloseTo(130);
    expect(result.current.variance).toBeCloseTo(0);
  });

});

describe("useEndOfDayReportData - keycards", () => {
  beforeEach(setupDefaultMocks);

  it("computes keycard counts and variance", () => {
    mockUseTillData.mockReturnValue({
      transactions: [
        {
          type: "Loan",
          isKeycard: true,
          count: 2,
          amount: 0,
          timestamp: "2024-01-01T12:00:00Z",
        },
        {
          type: "Refund",
          isKeycard: true,
          count: 1,
          amount: 0,
          timestamp: "2024-01-01T18:00:00Z",
        },
      ],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T08:00:00Z", type: "opening", keycardCount: 5 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", keycardCount: 4 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        { user: "s", timestamp: "2024-01-01T07:00:00Z", type: "opening", keycardCount: 10 },
        {
          user: "s",
          timestamp: "2024-01-01T09:00:00Z",
          type: "deposit",
          keycardCount: 1,
          keycardDifference: 1,
        },
        {
          user: "s",
          timestamp: "2024-01-01T10:00:00Z",
          type: "withdrawal",
          keycardCount: 2,
          keycardDifference: 2,
        },
        { user: "s", timestamp: "2024-01-01T22:00:00Z", type: "safeReconcile", keycardCount: 9 },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.openingKeycards).toBe(15);
    expect(result.current.closingKeycards).toBe(13);
    expect(result.current.safeKeycardInflowsTotal).toBe(1);
    expect(result.current.safeKeycardOutflowsTotal).toBe(2);
    expect(result.current.expectedKeycards).toBe(13);
    expect(result.current.keycardVariance).toBe(0);
    expect(result.current.keycardVarianceMismatch).toBe(false);
  });

  it("ignores negligible keycard variance", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [
        {
          user: "u",
          timestamp: "2024-01-01T08:00:00Z",
          type: "opening",
          keycardCount: 10,
        },
        {
          user: "u",
          timestamp: "2024-01-01T22:00:00Z",
          type: "close",
          keycardCount: 10.005,
        },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.expectedKeycards).toBe(10);
    expect(result.current.closingKeycards).toBe(10.005);
    expect(result.current.keycardVariance).toBeCloseTo(0.005);
    expect(result.current.keycardVarianceMismatch).toBe(false);
  });

  it("includes keycard transfers in totals and expected keycards", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T08:00:00Z", type: "opening", keycardCount: 5 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", keycardCount: 5 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        { user: "s", timestamp: "2024-01-01T07:00:00Z", type: "opening", keycardCount: 10 },
        {
          user: "s",
          timestamp: "2024-01-01T09:00:00Z",
          type: "deposit",
          keycardCount: 1,
          keycardDifference: 1,
        },
        {
          user: "s",
          timestamp: "2024-01-01T10:00:00Z",
          type: "withdrawal",
          keycardCount: 1,
          keycardDifference: 1,
        },
        { user: "s", timestamp: "2024-01-01T22:00:00Z", type: "safeReconcile", keycardCount: 9 },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });
    mockUseKeycardTransfersData.mockReturnValue({
      transfers: [
        { user: "s", timestamp: "2024-01-01T11:00:00Z", count: 3, direction: "toSafe" },
        { user: "s", timestamp: "2024-01-01T12:00:00Z", count: 4, direction: "fromSafe" },
      ],
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.safeKeycardInflowsTotal).toBe(4);
    expect(result.current.safeKeycardOutflowsTotal).toBe(5);
    expect(result.current.expectedKeycards).toBe(14);
    expect(result.current.keycardTransfersToSafe).toEqual({
      rows: [
        { user: "s", timestamp: "2024-01-01T11:00:00Z", count: 3, direction: "toSafe" },
      ],
      total: 3,
    });
      expect(result.current.keycardTransfersFromSafe).toEqual({
        rows: [
          { user: "s", timestamp: "2024-01-01T12:00:00Z", count: 4, direction: "fromSafe" },
        ],
        total: 4,
      });
    });

    it("includes bank withdrawals in safe keycard inflows", () => {
      mockUseTillData.mockReturnValue({
        transactions: [],
        cashCounts: [
          { user: "u", timestamp: "2024-01-01T08:00:00Z", type: "opening", keycardCount: 0 },
          { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", keycardCount: 0 },
        ],
        creditSlips: [],
        loading: false,
        error: null,
      });
      mockUseSafeLogic.mockReturnValue({
        safeCounts: [
          { user: "s", timestamp: "2024-01-01T07:00:00Z", type: "opening", keycardCount: 0 },
          {
            user: "s",
            timestamp: "2024-01-01T09:00:00Z",
            type: "deposit",
            keycardCount: 1,
            keycardDifference: 1,
          },
          {
            user: "s",
            timestamp: "2024-01-01T10:00:00Z",
            type: "bankWithdrawal",
            keycardCount: 2,
            keycardDifference: 2,
          },
          { user: "s", timestamp: "2024-01-01T22:00:00Z", type: "safeReconcile", keycardCount: 3 },
        ],
        getSafeBalanceAt: mockGetSafeBalanceAt,
        loading: false,
        error: null,
      });

      const { result } = renderHook(
        () => useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
        { wrapper }
      );

      expect(result.current.safeKeycardInflowsTotal).toBe(3);
      expect(result.current.safeKeycardOutflowsTotal).toBe(0);
      expect(result.current.expectedKeycards).toBe(3);
      expect(result.current.keycardVariance).toBe(0);
    });

    it("adjusts expected keycards by reconcile differences", () => {
      mockUseTillData.mockReturnValue({
        transactions: [],
      cashCounts: [
        { user: "u", timestamp: "2024-01-01T08:00:00Z", type: "opening", keycardCount: 0 },
        { user: "u", timestamp: "2024-01-01T22:00:00Z", type: "close", keycardCount: 0 },
      ],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        { user: "s", timestamp: "2024-01-01T07:00:00Z", type: "opening", keycardCount: 10 },
        {
          user: "s",
          timestamp: "2024-01-01T12:00:00Z",
          type: "safeReset",
          keycardCount: 9,
          keycardDifference: -1,
        },
        {
          user: "s",
          timestamp: "2024-01-01T22:00:00Z",
          type: "safeReconcile",
          keycardCount: 11,
          keycardDifference: 2,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.keycardReconcileAdjustment).toBe(1);
    expect(result.current.expectedKeycards).toBe(11);
    expect(result.current.keycardVariance).toBe(0);
  });

  it("filters keycard discrepancies by date", () => {
    mockUseKeycardDiscrepanciesData.mockReturnValue({
      keycardDiscrepancies: [
        { user: "a", timestamp: "2024-01-01T10:00:00Z", amount: 1 },
        { user: "b", timestamp: "2024-01-02T10:00:00Z", amount: 2 },
      ] as KeycardDiscrepancy[],
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-01T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.todaysKeycardDiscrepancies).toEqual([
      { user: "a", timestamp: "2024-01-01T10:00:00Z", amount: 1 },
    ]);
    expect(result.current.keycardDiscrepancyTotal).toBe(1);
  });

});

describe("useEndOfDayReportData - safe balances", () => {
  beforeEach(setupDefaultMocks);

  it("uses same-day safe entry for beginning balance when available", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockGetSafeBalanceAt.mockReturnValue(70);
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T22:00:00Z",
          type: "safeReconcile",
          count: 60,
        },
        {
          user: "s",
          timestamp: "2024-01-02T08:00:00Z",
          type: "opening",
          count: 65,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-02T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.beginningSafeBalance).toBe(65);
    expect(result.current.endingSafeBalance).toBe(70);
    expect(mockGetSafeBalanceAt).toHaveBeenCalledTimes(2);
  });

  it("falls back to prior day balance when no same-day entry exists", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockGetSafeBalanceAt
      .mockImplementationOnce(() => 60)
      .mockImplementationOnce(() => 70);
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T22:00:00Z",
          type: "safeReconcile",
          count: 60,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-02T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.beginningSafeBalance).toBe(60);
    expect(result.current.endingSafeBalance).toBe(70);
    expect(mockGetSafeBalanceAt).toHaveBeenCalledTimes(2);
  });

  it("uses prior day's balance when first entry is after midnight", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockGetSafeBalanceAt
      .mockImplementationOnce(() => 60)
      .mockImplementationOnce(() => 70);
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T22:00:00Z",
          type: "safeReconcile",
          count: 60,
        },
        {
          user: "s",
          timestamp: "2024-01-02T02:00:00Z",
          type: "deposit",
          amount: 10,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-02T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.beginningSafeBalance).toBe(60);
    expect(result.current.endingSafeBalance).toBe(70);
    expect(mockGetSafeBalanceAt).toHaveBeenCalledTimes(2);
  });

  it("uses latest opening even when days earlier", () => {
    mockUseTillData.mockReturnValue({
      transactions: [],
      cashCounts: [],
      creditSlips: [],
      loading: false,
      error: null,
    });
    mockGetSafeBalanceAt.mockReturnValue(0);
    mockUseSafeLogic.mockReturnValue({
      safeCounts: [
        {
          user: "s",
          timestamp: "2024-01-01T08:00:00Z",
          type: "opening",
          count: 60,
        },
      ],
      getSafeBalanceAt: mockGetSafeBalanceAt,
      loading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useEndOfDayReportData(new Date("2024-01-04T00:00:00Z")),
      { wrapper }
    );

    expect(result.current.beginningSafeBalance).toBe(60);
  });
});
