import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useFirebaseSubscription from "../../hooks/data/useFirebaseSubscription";
import type { LoanTransaction, Loans } from "../../types/hooks/data/loansData";
import * as toastUtils from "../../utils/toastUtils";
import { LoanDataProvider, useLoanData } from "../LoanDataContext";

vi.mock("../../hooks/data/useFirebaseSubscription");
const mockedSubscription = vi.mocked(useFirebaseSubscription);

const saveLoanMock = vi.fn();
const removeLoanItemMock = vi.fn();
const removeLoanTransactionsForItemMock = vi.fn();
const updateLoanDepositTypeMock = vi.fn();
const convertKeycardDocToCashMock = vi.fn();
const removeOccupantIfEmptyMock = vi.fn();

vi.mock("../../hooks/mutations/useLoansMutations", () => ({
  default: () => ({
    saveLoan: saveLoanMock,
    removeLoanItem: removeLoanItemMock,
    removeLoanTransactionsForItem: removeLoanTransactionsForItemMock,
    updateLoanDepositType: updateLoanDepositTypeMock,
    convertKeycardDocToCash: convertKeycardDocToCashMock,
    removeOccupantIfEmpty: removeOccupantIfEmptyMock,
    error: null,
  }),
}));

const toastMock = vi
  .spyOn(toastUtils, "showToast")
  .mockImplementation(() => undefined);

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LoanDataProvider>{children}</LoanDataProvider>
);

const baseTxn: LoanTransaction = {
  count: 1,
  createdAt: "2024-01-01",
  depositType: "CASH",
  deposit: 10,
  item: "Umbrella",
  type: "Loan",
};

describe("LoanDataContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    saveLoanMock.mockResolvedValue(undefined);
    removeLoanItemMock.mockResolvedValue(undefined);
    removeLoanTransactionsForItemMock.mockResolvedValue(undefined);
    updateLoanDepositTypeMock.mockResolvedValue(undefined);
    convertKeycardDocToCashMock.mockResolvedValue(undefined);
    removeOccupantIfEmptyMock.mockResolvedValue(undefined);
  });

  it("saveLoan updates state", async () => {
    const { result } = renderHook(() => useLoanData(), { wrapper });
    await act(async () => {
      await result.current.saveLoan("B1", "O1", "T1", baseTxn);
    });
    expect(result.current.loans).toEqual({
      B1: { O1: { txns: { T1: baseTxn } } },
    });
  });

  it("removeLoanItem updates state", async () => {
    const loans: Loans = { B1: { O1: { txns: { T1: baseTxn } } } };
    mockedSubscription.mockReturnValue({
      data: loans,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useLoanData(), { wrapper });
    await act(async () => {
      await result.current.removeLoanItem("B1", "O1", "T1", "Umbrella");
    });
    expect(result.current.loans).toEqual({});
  });

  it("removeLoanTransactionsForItem updates state", async () => {
    const txn2: LoanTransaction = { ...baseTxn, item: "Umbrella" };
    const txn2Refund: LoanTransaction = { ...txn2, type: "Refund" };
    const txn3: LoanTransaction = { ...baseTxn, item: "Padlock" };
    const loans: Loans = {
      B1: {
        O1: { txns: { T1: txn2, T2: txn2Refund, T3: txn3 } },
      },
    };
    mockedSubscription.mockReturnValue({
      data: loans,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useLoanData(), { wrapper });
    await act(async () => {
      await result.current.removeLoanTransactionsForItem(
        "B1",
        "O1",
        "Umbrella"
      );
    });
    expect(result.current.loans).toEqual({
      B1: { O1: { txns: { T2: txn2Refund, T3: txn3 } } },
    });
  });

  it("updateLoanDepositType updates state", async () => {
    const txn: LoanTransaction = {
      ...baseTxn,
      depositType: "PASSPORT",
      deposit: 0,
      count: 2,
    };
    const loans: Loans = { B1: { O1: { txns: { T1: txn } } } };
    mockedSubscription.mockReturnValue({
      data: loans,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useLoanData(), { wrapper });
    await act(async () => {
      await result.current.updateLoanDepositType("B1", "O1", "T1", "CASH");
    });
    expect(result.current.loans?.B1?.O1.txns.T1.depositType).toBe("CASH");
    expect(result.current.loans?.B1?.O1.txns.T1.deposit).toBe(20);
  });

  it("convertKeycardDocToCash updates state", async () => {
    const txn: LoanTransaction = {
      ...baseTxn,
      depositType: "PASSPORT",
      deposit: 0,
      count: 2,
    };
    const loans: Loans = { B1: { O1: { txns: { T1: txn } } } };
    mockedSubscription.mockReturnValue({
      data: loans,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useLoanData(), { wrapper });
    await act(async () => {
      await result.current.convertKeycardDocToCash("B1", "O1", "T1", 2);
    });
    expect(result.current.loans?.B1?.O1.txns.T1.depositType).toBe("CASH");
    expect(result.current.loans?.B1?.O1.txns.T1.deposit).toBe(20);
  });

  it("removeOccupantIfEmpty removes empty occupant", async () => {
    const loans: Loans = { B1: { O1: { txns: {} } } };
    mockedSubscription.mockReturnValue({
      data: loans,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useLoanData(), { wrapper });
    await act(async () => {
      await result.current.removeOccupantIfEmpty("B1", "O1");
    });
    expect(result.current.loans).toEqual({});
  });

  it("shows error toasts when mutations fail", async () => {
    const { result } = renderHook(() => useLoanData(), { wrapper });
    const err = new Error("fail");

    saveLoanMock.mockRejectedValue(err);
    await expect(
      result.current.saveLoan("B", "O", "T", baseTxn)
    ).rejects.toThrow("fail");
    expect(toastMock).toHaveBeenCalledWith("Failed to save loan", "error");

    toastMock.mockClear();
    removeLoanItemMock.mockRejectedValue(err);
    await expect(
      result.current.removeLoanItem("B", "O", "T", "Umbrella")
    ).rejects.toThrow("fail");
    expect(toastMock).toHaveBeenCalledWith(
      "Failed to remove loan item",
      "error"
    );

    toastMock.mockClear();
    removeLoanTransactionsForItemMock.mockRejectedValue(err);
    await expect(
      result.current.removeLoanTransactionsForItem("B", "O", "Umbrella")
    ).rejects.toThrow("fail");
    expect(toastMock).toHaveBeenCalledWith(
      "Failed to remove loan records",
      "error"
    );

    toastMock.mockClear();
    updateLoanDepositTypeMock.mockRejectedValue(err);
    await expect(
      result.current.updateLoanDepositType("B", "O", "T", "CASH")
    ).rejects.toThrow("fail");
    expect(toastMock).toHaveBeenCalledWith(
      "Failed to update deposit type",
      "error"
    );

    toastMock.mockClear();
    convertKeycardDocToCashMock.mockRejectedValue(err);
    await expect(
      result.current.convertKeycardDocToCash("B", "O", "T", 1)
    ).rejects.toThrow("fail");
    expect(toastMock).toHaveBeenCalledWith(
      "Failed to update keycard state",
      "error"
    );

    toastMock.mockClear();
    removeOccupantIfEmptyMock.mockRejectedValue(err);
    await expect(
      result.current.removeOccupantIfEmpty("B", "O")
    ).rejects.toThrow("fail");
    expect(toastMock).toHaveBeenCalledWith(
      "Failed to update loan data",
      "error"
    );
  });

  it("handles invalid subscription data", () => {
    const badData = {
      B1: { O1: { txns: { T1: { deposit: 10 } } } },
    } as unknown as Loans;
    mockedSubscription.mockReturnValue({
      data: badData,
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useLoanData(), { wrapper });
    expect(result.current.loans).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it("rejects invalid loan transactions", async () => {
    const { result } = renderHook(() => useLoanData(), { wrapper });
    const invalid = {
      ...baseTxn,
      depositType: "BAD",
    } as unknown as LoanTransaction;
    await expect(
      result.current.saveLoan("B1", "O1", "T1", invalid)
    ).rejects.toBeTruthy();
    expect(saveLoanMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith("Invalid loan transaction", "error");
  });
});
