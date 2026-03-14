import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

// Module-level mocks (var hoisting required for jest.mock factory access)
/* eslint-disable no-var */
var mockRecordKeycardTransfer: jest.Mock;
var mockUpdateSafeKeycards: jest.Mock;
var mockSafeKeycards: number;
var mockRunTransaction: jest.Mock;
var mockShowToast: jest.Mock;
/* eslint-enable no-var */

jest.mock("../client/till/useTillShifts", () => ({
  useTillShifts: () => ({
    setShowOpenShiftForm: jest.fn(),
    setShowCloseShiftForm: jest.fn(),
    closeShiftFormVariant: "close" as const,
    setShowKeycardCountForm: jest.fn(),
    handleOpenShiftClick: jest.fn(),
    handleCloseShiftClick: jest.fn(),
    handleKeycardCountClick: jest.fn(),
    addKeycardsFromSafe: jest.fn(),
    returnKeycardsToSafe: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock("../data/useCashDrawerLimit", () => ({
  useCashDrawerLimit: () => ({ updateLimit: jest.fn() }),
}));

jest.mock("../data/useSafeKeycardCount", () => ({
  useSafeKeycardCount: () => ({
    count: mockSafeKeycards,
    updateCount: (...args: unknown[]) => mockUpdateSafeKeycards(...args),
  }),
}));

jest.mock("../useCashCounts", () => ({
  useCashCounts: () => ({
    recordFloatEntry: jest.fn(),
    addCashCount: jest.fn(),
  }),
}));

jest.mock("../useKeycardTransfer", () => ({
  useKeycardTransfer: () =>
    (...args: unknown[]) => mockRecordKeycardTransfer(...args),
}));

jest.mock("../useSafeLogic", () => ({
  useSafeLogic: () => ({
    recordDeposit: jest.fn(),
    recordWithdrawal: jest.fn(),
    recordBankWithdrawal: jest.fn(),
    recordBankDeposit: jest.fn(),
    recordExchange: jest.fn(),
  }),
}));

jest.mock("../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => mockShowToast(...args),
}));

jest.mock("../../utils/transaction", () => ({
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
}));

beforeEach(() => {
  mockSafeKeycards = 5;
  mockRecordKeycardTransfer = jest.fn().mockResolvedValue(undefined);
  mockUpdateSafeKeycards = jest.fn();
  mockRunTransaction = jest.fn().mockResolvedValue(undefined);
  mockShowToast = jest.fn();
});

function makeUI() {
  return {
    closeCashForms: jest.fn(),
    setCashForm: jest.fn(),
    cashForm: "none" as const,
  };
}

// TC-03: Bug 2 — confirmFloat must close the modal (ui.setCashForm("none")) on success
describe("TC-03: confirmFloat modal close behaviour", () => {
  it("calls ui.setCashForm('none') after a successful transaction", async () => {
    const { useTillReconciliationLogic } = await import(
      "../useTillReconciliationLogic"
    );
    const ui = makeUI();
    const { result } = renderHook(() => useTillReconciliationLogic(ui));

    await act(async () => {
      await result.current.confirmFloat(50);
    });

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(ui.setCashForm).toHaveBeenCalledWith("none");
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it("does NOT call ui.setCashForm when the transaction throws", async () => {
    mockRunTransaction.mockRejectedValueOnce(new Error("network error"));
    const { useTillReconciliationLogic } = await import(
      "../useTillReconciliationLogic"
    );
    const ui = makeUI();
    const { result } = renderHook(() => useTillReconciliationLogic(ui));

    await act(async () => {
      await result.current.confirmFloat(50);
    });

    expect(ui.setCashForm).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      "Failed to confirm float.",
      "error"
    );
  });
});

// TC-04: Bug 3 success — Firebase write (recordKeycardTransfer) must complete
//        BEFORE the UI state (updateSafeKeycards) is updated
describe("TC-04: confirmAddKeycard — Firebase write precedes UI state update", () => {
  it("calls recordKeycardTransfer before updateSafeKeycards on success", async () => {
    const callOrder: string[] = [];
    mockRecordKeycardTransfer = jest.fn().mockImplementation(() => {
      callOrder.push("recordKeycardTransfer");
      return Promise.resolve();
    });
    mockUpdateSafeKeycards = jest.fn().mockImplementation(() => {
      callOrder.push("updateSafeKeycards");
    });

    const { useTillReconciliationLogic } = await import(
      "../useTillReconciliationLogic"
    );
    const ui = makeUI();
    const { result } = renderHook(() => useTillReconciliationLogic(ui));

    await act(async () => {
      await result.current.confirmAddKeycard(2);
    });

    expect(mockRecordKeycardTransfer).toHaveBeenCalledWith(2, "fromSafe");
    // safeKeycards=5, count=2 → updateSafeKeycards(3)
    expect(mockUpdateSafeKeycards).toHaveBeenCalledWith(3);
    expect(callOrder).toEqual(["recordKeycardTransfer", "updateSafeKeycards"]);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});

// TC-05: Bug 3 failure — when Firebase write fails, show toast and do NOT update UI state
describe("TC-05: confirmAddKeycard — Firebase failure handling", () => {
  it("shows error toast and does not update safe keycards when Firebase write rejects", async () => {
    mockRecordKeycardTransfer = jest
      .fn()
      .mockRejectedValue(new Error("Firebase error"));

    const { useTillReconciliationLogic } = await import(
      "../useTillReconciliationLogic"
    );
    const ui = makeUI();
    const { result } = renderHook(() => useTillReconciliationLogic(ui));

    await act(async () => {
      await result.current.confirmAddKeycard(2);
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Failed to record keycard transfer.",
      "error"
    );
    expect(mockUpdateSafeKeycards).not.toHaveBeenCalled();
    // Modal must close even on error (setShowAddKeycardModal(false) is called before try/catch)
    expect(result.current.showAddKeycardModal).toBe(false);
  });
});
