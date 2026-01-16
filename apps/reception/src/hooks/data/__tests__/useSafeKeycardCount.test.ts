import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* eslint-disable no-var */
var mockedSub: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
var runTransactionMock: ReturnType<typeof vi.fn>;
var logMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../useFirebaseSubscription", () => {
  mockedSub = vi.fn();
  return { default: mockedSub };
});

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

vi.mock("firebase/database", () => {
  refMock = vi.fn(() => ({}));
  runTransactionMock = vi.fn();
  return { ref: refMock, runTransaction: runTransactionMock };
});

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

vi.mock("../../../services/logSettingChange", () => {
  logMock = vi.fn(() => Promise.resolve());
  return { logSettingChange: logMock };
});

import { useSafeKeycardCount } from "../useSafeKeycardCount";

describe("useSafeKeycardCount", () => {
  afterEach(() => vi.clearAllMocks());

  it("subscribes with a number schema", () => {
    mockedSub.mockReturnValue({ data: 0, loading: false, error: null });
    renderHook(() => useSafeKeycardCount());
    expect(mockedSub).toHaveBeenCalledWith(
      "settings/safeKeycards",
      expect.objectContaining({ safeParse: expect.any(Function) })
    );
  });

  it("logs audit entry and updates firebase", async () => {
    mockedSub.mockReturnValue({ data: 1, loading: false, error: null });
    runTransactionMock.mockImplementation(async (_ref, updater) => {
      const newVal = updater(1);
      return { committed: true, snapshot: { val: () => newVal } };
    });
    const { result } = renderHook(() => useSafeKeycardCount());

    await act(async () => {
      await result.current.updateCount(5);
    });

    expect(refMock).toHaveBeenCalledWith({}, "settings/safeKeycards");
    expect(runTransactionMock).toHaveBeenCalledWith(
      refMock.mock.results[0].value,
      expect.any(Function)
    );
    expect(logMock).toHaveBeenCalledWith({}, {
      user: "tester",
      setting: "safeKeycards",
      oldValue: 1,
      newValue: 5,
    });
    expect(runTransactionMock.mock.invocationCallOrder[0]).toBeLessThan(
      logMock.mock.invocationCallOrder[0]
    );
  });

  it("handles concurrent updates atomically", async () => {
    mockedSub.mockReturnValue({ data: 1, loading: false, error: null });
    let currentValue = 1;
    runTransactionMock.mockImplementation(async (_ref, updater) => {
      const newVal = updater(currentValue);
      currentValue = newVal;
      return { committed: true, snapshot: { val: () => newVal } };
    });

    const { result } = renderHook(() => useSafeKeycardCount());

    await act(async () => {
      await Promise.all([
        result.current.updateCount(5),
        result.current.updateCount(7),
      ]);
    });

    expect(runTransactionMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenNthCalledWith(1, {}, {
      user: "tester",
      setting: "safeKeycards",
      oldValue: 1,
      newValue: 5,
    });
    expect(logMock).toHaveBeenNthCalledWith(2, {}, {
      user: "tester",
      setting: "safeKeycards",
      oldValue: 5,
      newValue: 7,
    });
  });
});
