import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { ToastMessageType } from "../../../utils/toastUtils";
import { useShiftEventsMutations } from "../useShiftEventsMutations";

/* eslint-disable no-var */
var database: unknown;
var user: unknown;
var refMock: jest.Mock;
var pushMock: jest.Mock;
var setMock: jest.Mock;
var eventsStore: Record<string, unknown>;
var toastMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  push: (...args: unknown[]) => pushMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

jest.mock("../../../utils/toastUtils", () => ({
  showToast: (message: string, type: ToastMessageType) =>
    toastMock(message, type),
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  eventsStore = {};
  refMock = jest.fn(() => "tillEvents");
  pushMock = jest.fn(() => ({ key: "event1" }));
  setMock = jest.fn((refObj: { key: string }, data: unknown) => {
    eventsStore[refObj.key] = data;
    return Promise.resolve();
  });
  toastMock = jest.fn();
});

describe("useShiftEventsMutations", () => {
  it("writes shift event to firebase", async () => {
    const { result } = renderHook(() => useShiftEventsMutations());

    await act(async () => {
      await result.current.addShiftEvent("open", 100, 2, 5);
    });

    expect(refMock).toHaveBeenCalledWith(database, "tillEvents");
    expect(pushMock).toHaveBeenCalledWith("tillEvents");
    expect(eventsStore["event1"]).toEqual({
      user: "tester",
      timestamp: "2024-01-01T10:00:00Z",
      action: "open",
      cashCount: 100,
      keycardCount: 2,
      difference: 5,
      shiftId: undefined,
    });
  });

  it("does nothing when user missing", async () => {
    user = null;
    const { result } = renderHook(() => useShiftEventsMutations());

    await act(async () => {
      await result.current.addShiftEvent("close", 50, 1, 0);
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });
});
