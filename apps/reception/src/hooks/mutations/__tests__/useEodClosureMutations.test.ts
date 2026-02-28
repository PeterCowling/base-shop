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

  it("TC-01: writes set() with correct path and payload when user is present", async () => {
    const { result } = renderHook(() => useEodClosureMutations());

    await result.current.confirmDayClosed();

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith("eodClosures/2026-02-28", {
      date: "2026-02-28",
      timestamp: "2026-02-28T22:00:00.000+01:00",
      confirmedBy: "pete",
      uid: undefined,
    });
  });

  it("TC-02: does not call set() when user is null", async () => {
    userMock = null;

    const { result } = renderHook(() => useEodClosureMutations());

    await result.current.confirmDayClosed();

    expect(setMock).not.toHaveBeenCalled();
  });
});
