import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useAllTransactions from "../useAllTransactionsMutations";

/* eslint-disable no-var */
var mockUser: { user_name: string } | null;
var refMock: jest.Mock;
var getMock: jest.Mock;
var updateMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

function snapshotExists() {
  return { exists: () => true, val: () => ({}) };
}

beforeEach(() => {
  mockUser = { user_name: "Tester" };
  refMock = jest.fn((_db: unknown, path?: string) => path ?? "");
  getMock = jest.fn().mockResolvedValue(snapshotExists());
  updateMock = jest.fn().mockResolvedValue(undefined);
});

describe("useAllTransactionsMutations", () => {
  it("throws when user is not logged in", async () => {
    mockUser = null;
    const { result } = renderHook(() => useAllTransactions());

    await act(async () => {
      await expect(
        result.current.addToAllTransactions("txn-1", { amount: 10 })
      ).rejects.toThrow("User is not logged in");
    });
  });

  it("throws when attempting to overwrite existing transaction with disallowed fields", async () => {
    const { result } = renderHook(() => useAllTransactions());

    await act(async () => {
      await expect(
        result.current.addToAllTransactions("txn-1", {
          amount: 10,
          description: "Not allowed on existing tx",
        })
      ).rejects.toThrow("Refusing to overwrite existing transaction");
    });
  });

  it("allows void-only updates on existing transaction", async () => {
    const { result } = renderHook(() => useAllTransactions());

    await act(async () => {
      await expect(
        result.current.addToAllTransactions("txn-1", {
          voidedAt: "2026-03-05T10:00:00.000Z",
          voidReason: "test",
        })
      ).resolves.toBeUndefined();
    });

    expect(updateMock).toHaveBeenCalledWith("", {
      "allFinancialTransactions/txn-1/voidedAt": "2026-03-05T10:00:00.000Z",
      "allFinancialTransactions/txn-1/voidReason": "test",
    });
  });
});

