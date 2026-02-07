import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useSafeKeycardCount } from "../useSafeKeycardCount";

/* eslint-disable no-var */
var mockedSub: jest.Mock;
var refMock: jest.Mock;
var runTransactionMock: jest.Mock;
var logMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../useFirebaseSubscription", () => {
  mockedSub = jest.fn();
  return { default: mockedSub };
});

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("firebase/database", () => {
  refMock = jest.fn(() => ({}));
  runTransactionMock = jest.fn();
  return { ref: refMock, runTransaction: runTransactionMock };
});

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

jest.mock("../../../services/logSettingChange", () => {
  logMock = jest.fn(() => Promise.resolve());
  return { logSettingChange: logMock };
});

describe("useSafeKeycardCount", () => {
  afterEach(() => jest.clearAllMocks());

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
