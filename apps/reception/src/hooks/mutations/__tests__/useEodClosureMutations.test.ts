import { renderHook } from "@testing-library/react";

import { useEodClosureMutations } from "../useEodClosureMutations";

/* eslint-disable no-var */
var mockDb: Record<string, unknown> = {};
var userMock: { user_name: string; uid?: string } | null = {
  user_name: "pete",
  uid: undefined,
};
var refMock: jest.Mock;
var setMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDb,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: userMock }),
}));

jest.mock("../../../utils/dateUtils", () => ({
  getItalyIsoString: () => "2026-02-28T22:00:00.000+01:00",
  extractItalyDate: () => "2026-02-28",
}));

jest.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  set: (...args: unknown[]) => setMock(...args),
}));

describe("useEodClosureMutations", () => {
  beforeEach(() => {
    mockDb = {};
    userMock = { user_name: "pete", uid: undefined };
    refMock = jest.fn((db: unknown, path: string) => path);
    setMock = jest.fn().mockResolvedValue(undefined);
  });

  it("TC-01: confirmDayClosed with snapshot → set() called with cashVariance and stockItemsCounted", async () => {
    const { result } = renderHook(() => useEodClosureMutations());

    await result.current.confirmDayClosed({ cashVariance: -3.5, stockItemsCounted: 12 });

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith("eodClosures/2026-02-28", {
      date: "2026-02-28",
      timestamp: "2026-02-28T22:00:00.000+01:00",
      confirmedBy: "pete",
      uid: undefined,
      cashVariance: -3.5,
      stockItemsCounted: 12,
    });
  });

  it("TC-02: does not call set() when user is null", async () => {
    userMock = null;

    const { result } = renderHook(() => useEodClosureMutations());

    await result.current.confirmDayClosed();

    expect(setMock).not.toHaveBeenCalled();
  });

  it("TC-03: confirmDayClosed with zero-value snapshot → set() called with cashVariance: 0 and stockItemsCounted: 0", async () => {
    const { result } = renderHook(() => useEodClosureMutations());

    await result.current.confirmDayClosed({ cashVariance: 0, stockItemsCounted: 0 });

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith("eodClosures/2026-02-28", {
      date: "2026-02-28",
      timestamp: "2026-02-28T22:00:00.000+01:00",
      confirmedBy: "pete",
      uid: undefined,
      cashVariance: 0,
      stockItemsCounted: 0,
    });
  });

  it("TC-04: confirmDayClosed() with no args → set() called with original 4-field payload; no new fields present", async () => {
    const { result } = renderHook(() => useEodClosureMutations());

    await result.current.confirmDayClosed();

    expect(setMock).toHaveBeenCalledTimes(1);
    const calledWith = setMock.mock.calls[0][1] as Record<string, unknown>;
    expect(calledWith).toEqual({
      date: "2026-02-28",
      timestamp: "2026-02-28T22:00:00.000+01:00",
      confirmedBy: "pete",
      uid: undefined,
    });
    expect("cashVariance" in calledWith).toBe(false);
    expect("stockItemsCounted" in calledWith).toBe(false);
  });
});
