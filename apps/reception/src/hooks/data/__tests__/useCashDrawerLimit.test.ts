import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* eslint-disable no-var */
var mockedSub: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
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
  setMock = vi.fn(() => Promise.resolve());
  return { ref: refMock, set: setMock };
});

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

vi.mock("../../../services/logSettingChange", () => {
  logMock = vi.fn(() => Promise.resolve());
  return { logSettingChange: logMock };
});

import { useCashDrawerLimit } from "../useCashDrawerLimit";

describe("useCashDrawerLimit", () => {
  afterEach(() => vi.clearAllMocks());

  it("subscribes with a number schema", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: null });
    renderHook(() => useCashDrawerLimit());
    expect(mockedSub).toHaveBeenCalledWith(
      "settings/cashDrawerLimit",
      expect.objectContaining({ safeParse: expect.any(Function) })
    );
  });

  it("returns limit data", () => {
    mockedSub.mockReturnValue({ data: 100, loading: false, error: null });
    const { result } = renderHook(() => useCashDrawerLimit());
    expect(result.current.limit).toBe(100);
    expect(result.current.loading).toBe(false);
  });

  it("returns null when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: true, error: null });
    const { result } = renderHook(() => useCashDrawerLimit());
    expect(result.current.limit).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("logs audit entry and updates firebase", async () => {
    mockedSub.mockReturnValue({ data: 50, loading: false, error: null });
    const { result } = renderHook(() => useCashDrawerLimit());

    await act(async () => {
      await result.current.updateLimit(200);
    });

    expect(logMock).toHaveBeenCalledWith({}, {
      user: "tester",
      setting: "cashDrawerLimit",
      oldValue: 50,
      newValue: 200,
    });
    expect(refMock).toHaveBeenCalledWith({}, "settings/cashDrawerLimit");
    expect(setMock).toHaveBeenCalledWith(refMock.mock.results[0].value, 200);
    expect(logMock.mock.invocationCallOrder[0]).toBeLessThan(
      setMock.mock.invocationCallOrder[0]
    );
  });

  it("propagates errors", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: "err" });
    const { result } = renderHook(() => useCashDrawerLimit());
    expect(result.current.error).toBe("err");
  });
});
