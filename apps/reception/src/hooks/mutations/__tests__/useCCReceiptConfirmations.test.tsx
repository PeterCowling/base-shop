import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useCCReceiptConfirmations } from "../useCCReceiptConfirmations";

/* eslint-disable no-var */
var database: unknown;
var user: { user_name: string } | null;
var setMock: jest.Mock;
var refMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  setMock = jest.fn();
  refMock = jest.fn(() => "ref");
});

describe("useCCReceiptConfirmations", () => {
  it("writes confirmation record", async () => {
    const { result } = renderHook(() => useCCReceiptConfirmations());

    await act(async () => {
      await result.current.confirmReceipt("txn1");
    });

    expect(refMock).toHaveBeenCalledWith(
      database,
      "ccReceiptConfirmations/txn1"
    );
    expect(setMock).toHaveBeenCalledWith("ref", {
      user: "tester",
      timestamp: "2024-01-01T10:00:00Z",
    });
  });

  it("does nothing when user missing", async () => {
    user = null;
    const { result } = renderHook(() => useCCReceiptConfirmations());

    await act(async () => {
      await result.current.confirmReceipt("txn1");
    });

    expect(setMock).not.toHaveBeenCalled();
  });
});
