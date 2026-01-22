import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { CashCountType } from "../../../types/hooks/data/cashCountData";
import type { ToastMessageType } from "../../../utils/toastUtils";
import { useCashCountsMutations } from "../useCashCountsMutations";

/* eslint-disable no-var */
var database: unknown;
var user: unknown;
var pushMock: jest.Mock;
var setMock: jest.Mock;
var refMock: jest.Mock;
var addSafeCountMock: jest.Mock;
var depositHelperMock: jest.Mock;
var exchangeHelperMock: jest.Mock;
var toastMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

jest.mock("../useSafeCountsMutations", () => ({
  useSafeCountsMutations: () => ({ addSafeCount: addSafeCountMock }),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  push: (...args: unknown[]) => pushMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

jest.mock("../safeTransaction", () => ({
  deposit: (...args: unknown[]) => depositHelperMock(...args),
  exchange: (...args: unknown[]) => exchangeHelperMock(...args),
}));

jest.mock("../../../utils/toastUtils", () => ({
  showToast: (message: string, type: ToastMessageType) =>
    toastMock(message, type),
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  pushMock = jest.fn(() => "newRef");
  setMock = jest.fn();
  refMock = jest.fn(() => "cashCounts");
  addSafeCountMock = jest.fn();
  depositHelperMock = jest.fn();
  exchangeHelperMock = jest.fn();
  toastMock = jest.fn();
});

describe("useCashCountsMutations", () => {
  it("addCashCount writes to firebase", async () => {
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addCashCount(
        "opening",
        100,
        5,
        undefined,
        { "50": 2 },
        1
      );
    });

    expect(refMock).toHaveBeenCalledWith(database, "cashCounts");
    expect(pushMock).toHaveBeenCalledWith("cashCounts");
    expect(setMock).toHaveBeenCalledWith("newRef", {
      user: "tester",
      timestamp: "2024-01-01T10:00:00Z",
      type: "opening",
      count: 100,
      difference: 5,
      amount: undefined,
      denomBreakdown: { "50": 2 },
      keycardCount: 1,
    });
  });

  it("records keycard count for close action", async () => {
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addCashCount(
        "close",
        50,
        0,
        undefined,
        undefined,
        5
      );
    });

    expect(setMock).toHaveBeenCalledWith("newRef", {
      user: "tester",
      timestamp: "2024-01-01T10:00:00Z",
      type: "close",
      count: 50,
      difference: 0,
      amount: undefined,
      denomBreakdown: undefined,
      keycardCount: 5,
    });
  });

  it("addCashCount does nothing when user missing", async () => {
    user = null;
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addCashCount("opening", 1, 0);
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });

  it("addFloatEntry delegates to addCashCount", async () => {
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addFloatEntry(20);
    });

    expect(setMock).toHaveBeenCalledWith("newRef", {
      user: "tester",
      timestamp: "2024-01-01T10:00:00Z",
      type: "float",
      count: 0,
      difference: 0,
      amount: 20,
      denomBreakdown: undefined,
      keycardCount: undefined,
    });
  });

  it("addDeposit uses safe transaction helper", async () => {
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addDeposit(5, { a: 1 }, 2, 1);
    });

    expect(depositHelperMock).toHaveBeenCalledWith(
      addSafeCountMock,
      5,
      { a: 1 },
      2,
      1
    );
  });

  it("addWithdrawal calls addSafeCount", async () => {
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addWithdrawal(7, { b: 2 });
    });

    expect(addSafeCountMock).toHaveBeenCalledWith("withdrawal", 7, { b: 2 });
  });

  it("addExchange uses exchange helper", async () => {
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addExchange({ x: 1 }, { y: 2 }, "drawerToSafe", 3);
    });

    expect(exchangeHelperMock).toHaveBeenCalledWith(
      addSafeCountMock,
      { x: 1 },
      { y: 2 },
      3,
      "drawerToSafe"
    );
  });

  it("shows toast and skips write on validation failure", async () => {
    const { result } = renderHook(() => useCashCountsMutations());
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await act(async () => {
      await expect(
        result.current.addCashCount("bad" as CashCountType, 1, 0)
      ).rejects.toBeDefined();
    });

    expect(setMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.stringMatching(/Validation failed/),
      "error"
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("shows toast when firebase write fails", async () => {
    setMock.mockRejectedValue(new Error("fail"));
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useCashCountsMutations());

    await act(async () => {
      await result.current.addCashCount("opening", 1, 0);
    });

    expect(toastMock).toHaveBeenCalledWith(
      "Failed to save cash count.",
      "error"
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
