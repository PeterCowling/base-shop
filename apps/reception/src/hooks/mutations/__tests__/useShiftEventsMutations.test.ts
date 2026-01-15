import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToastMessageType } from "../../../utils/toastUtils";
import { useShiftEventsMutations } from "../useShiftEventsMutations";

/* eslint-disable no-var */
var database: unknown;
var user: unknown;
var refMock: ReturnType<typeof vi.fn>;
var pushMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
var eventsStore: Record<string, unknown>;
var toastMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => database,
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user }),
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  push: (...args: unknown[]) => pushMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

vi.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2024-01-01T10:00:00Z",
}));

vi.mock("../../../utils/toastUtils", () => ({
  showToast: (message: string, type: ToastMessageType) =>
    toastMock(message, type),
}));

beforeEach(() => {
  database = {};
  user = { user_name: "tester" };
  eventsStore = {};
  refMock = vi.fn(() => "tillEvents");
  pushMock = vi.fn(() => ({ key: "event1" }));
  setMock = vi.fn((refObj: { key: string }, data: unknown) => {
    eventsStore[refObj.key] = data;
    return Promise.resolve();
  });
  toastMock = vi.fn();
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

