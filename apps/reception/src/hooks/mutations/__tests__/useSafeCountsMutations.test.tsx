import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { useSafeCountsMutations } from "../useSafeCountsMutations";

/* eslint-disable no-var */
var mockDb: Record<string, unknown> = {};
var userMock: { user_name: string } | null = { user_name: "bob" };
var pushMock: jest.Mock;
var refMock: jest.Mock;
var setMock: jest.Mock;
var pushCount = 0;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDb,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: userMock }),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00.000+01:00",
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  push: (...args: unknown[]) => pushMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

describe("useSafeCountsMutations", () => {
  beforeEach(() => {
    mockDb = {};
    userMock = { user_name: "bob" };
    pushCount = 0;
    refMock = jest.fn((db: unknown, path: string) => path);
    pushMock = jest.fn(() => `ref${++pushCount}`);
    setMock = jest.fn();
  });

  it("writes records with correct data", async () => {
    const { result } = renderHook(() => useSafeCountsMutations());

    await result.current.addDeposit(10, 1, 0, { "5": 2 });
    await result.current.addWithdrawal(5, { "2": 1 });
    await result.current.addBankDeposit(20, 2, 1, { "10": 2 });
    await result.current.addBankWithdrawal(7, { "1": 7 });
    await result.current.addExchange({ a: 1 }, { b: 1 }, "drawerToSafe", 2);
    await result.current.addPettyWithdrawal(3);
    await result.current.addOpening(300, 3);
    await result.current.addReconcile(100, 5, 2, -1, { "50": 2 });
    await result.current.addReset(200, 4, 1, { "50": 4 });

    expect(setMock).toHaveBeenNthCalledWith(1, "ref1", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "deposit",
      amount: 10,
      denomBreakdown: { "5": 2 },
      keycardCount: 1,
      keycardDifference: 0,
    });
    expect(setMock).toHaveBeenNthCalledWith(2, "ref2", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "withdrawal",
      amount: 5,
      denomBreakdown: { "2": 1 },
      keycardCount: undefined,
      keycardDifference: undefined,
    });
    expect(setMock).toHaveBeenNthCalledWith(3, "ref3", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "bankDeposit",
      amount: 20,
      denomBreakdown: { "10": 2 },
      keycardCount: 2,
      keycardDifference: 1,
    });
    expect(setMock).toHaveBeenNthCalledWith(4, "ref4", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "bankWithdrawal",
      amount: 7,
      denomBreakdown: { "1": 7 },
      keycardCount: undefined,
      keycardDifference: undefined,
    });
    expect(setMock).toHaveBeenNthCalledWith(5, "ref5", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "exchange",
      amount: 2,
      denomBreakdown: { incoming: { b: 1 }, outgoing: { a: 1 } },
      keycardCount: undefined,
      keycardDifference: undefined,
      direction: "drawerToSafe",
    });
    expect(setMock).toHaveBeenNthCalledWith(6, "ref6", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "pettyWithdrawal",
      amount: 3,
      denomBreakdown: undefined,
      keycardCount: undefined,
      keycardDifference: undefined,
    });
    expect(setMock).toHaveBeenNthCalledWith(7, "ref7", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "opening",
      count: 300,
      keycardCount: 3,
    });
    expect(setMock).toHaveBeenNthCalledWith(8, "ref8", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "safeReconcile",
      count: 100,
      difference: 5,
      keycardCount: 2,
      keycardDifference: -1,
      denomBreakdown: { "50": 2 },
    });
    expect(setMock).toHaveBeenNthCalledWith(9, "ref9", {
      user: "bob",
      timestamp: "2024-01-01T10:00:00.000+01:00",
      type: "safeReset",
      count: 200,
      keycardCount: 4,
      keycardDifference: 1,
      denomBreakdown: { "50": 4 },
    });
  });

  it("returns early when no user", async () => {
    userMock = null;
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useSafeCountsMutations());

    await result.current.addDeposit(5, 0, 0);

    expect(setMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "No user is logged in; cannot add to safeCounts."
    );

    errorSpy.mockRestore();
  });
});
