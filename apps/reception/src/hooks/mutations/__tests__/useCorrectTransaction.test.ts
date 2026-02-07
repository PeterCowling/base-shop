import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { FinancialTransaction } from "../../../types/hooks/data/allFinancialTransaction";
import useCorrectTransaction from "../useCorrectTransaction";

/* eslint-disable no-var */
var database: unknown;
var user: { user_name: string; uid: string } | null;
var refMock: jest.Mock;
var getMock: jest.Mock;
var updateMock: jest.Mock;
var saveFinancialsRoomMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
}));

jest.mock("../../../utils/generateTransactionId", () => ({
  generateTransactionId: jest
    .fn()
    .mockReturnValueOnce("rev-1")
    .mockReturnValueOnce("rep-1")
    .mockReturnValueOnce("audit-1"),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

jest.mock("../../../utils/shiftId", () => ({
  getStoredShiftId: () => "shift-1",
}));

jest.mock("../useFinancialsRoomMutations", () => ({
  __esModule: true,
  default: () => ({ saveFinancialsRoom: saveFinancialsRoomMock }),
}));

beforeEach(() => {
  database = {};
  user = { user_name: "alice", uid: "u1" };
  refMock = jest.fn(() => "rootRef");
  getMock = jest.fn();
  updateMock = jest.fn();
  saveFinancialsRoomMock = jest.fn().mockResolvedValue(undefined);
});

describe("useCorrectTransaction", () => {
  it("writes reversal and replacement entries with audit log", async () => {
    const existing: FinancialTransaction = {
      amount: 100,
      bookingRef: "b1",
      count: 1,
      description: "Old desc",
      itemCategory: "Bar",
      method: "cash",
      occupantId: "occ1",
      timestamp: "2024-01-01T08:00:00Z",
      type: "payment",
      user_name: "alice",
    };
    getMock.mockResolvedValue({
      exists: () => true,
      val: () => existing,
    });

    const { result } = renderHook(() => useCorrectTransaction());

    await act(async () => {
      await result.current.correctTransaction(
        "txn-1",
        {
          amount: 120,
          method: "card",
          itemCategory: "Food",
          description: "Updated desc",
        },
        "Fix amount"
      );
    });

    expect(refMock).toHaveBeenCalledWith(database, "allFinancialTransactions/txn-1");
    expect(updateMock).toHaveBeenCalledWith("rootRef", {
      "allFinancialTransactions/rev-1": expect.objectContaining({
        amount: -100,
        type: "correction",
        sourceTxnId: "txn-1",
        correctionKind: "reversal",
        correctionReason: "Fix amount",
        correctedBy: "alice",
        correctedByUid: "u1",
        correctedShiftId: "shift-1",
      }),
      "allFinancialTransactions/rep-1": expect.objectContaining({
        amount: 120,
        method: "card",
        itemCategory: "Food",
        description: "Updated desc",
        type: "payment",
        sourceTxnId: "txn-1",
        correctionKind: "replacement",
        correctionReason: "Fix amount",
      }),
      "audit/financialTransactionAudits/audit-1": expect.objectContaining({
        sourceTxnId: "txn-1",
        reason: "Fix amount",
        correctionTxnIds: ["rev-1", "rep-1"],
      }),
    });

    expect(saveFinancialsRoomMock).toHaveBeenCalledWith("b1", {
      transactions: {
        "rev-1": expect.objectContaining({
          amount: -100,
          type: "payment",
          sourceTxnId: "txn-1",
          correctionKind: "reversal",
        }),
        "rep-1": expect.objectContaining({
          amount: 120,
          type: "payment",
          sourceTxnId: "txn-1",
          correctionKind: "replacement",
        }),
      },
    });
  });
});
