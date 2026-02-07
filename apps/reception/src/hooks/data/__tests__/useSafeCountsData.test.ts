import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";
import { endAt,orderByChild, startAt } from "firebase/database";

import { showToast } from "../../../utils/toastUtils";
import { useSafeCountsData } from "../useSafeCountsData";

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

interface SnapshotMock {
  exists: () => boolean;
  val: () => unknown;
}

let cb: ((snap: SnapshotMock) => void) | null = null;
let errCb: ((err: unknown) => void) | null = null;

jest.mock("firebase/database", () => {
  return {
    ref: jest.fn(() => ({})),
    query: jest.fn((r: unknown) => r),
    orderByChild: jest.fn(() => undefined),
    startAt: jest.fn(() => undefined),
    endAt: jest.fn(() => undefined),
    limitToFirst: jest.fn(() => undefined),
    onValue: jest.fn(
      (
        _ref: unknown,
        c: (snap: SnapshotMock) => void,
        e?: (err: unknown) => void
      ) => {
        cb = c;
        errCb = e || null;
        return () => undefined;
      }
    ),
  };
});

const showToastMock = showToast as unknown as jest.Mock;
const orderByChildMock = orderByChild as unknown as jest.Mock;
const startAtMock = startAt as unknown as jest.Mock;
const endAtMock = endAt as unknown as jest.Mock;

describe("useSafeCountsData", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cb = null;
    errCb = null;
  });

  it("returns parsed safe counts in chronological order", () => {
    const { result } = renderHook(() => useSafeCountsData());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({
          s1: {
            user: "u",
            timestamp: "2023-01-02T00:00:00Z",
            type: "deposit",
            amount: 5,
          },
          s2: {
            user: "u",
            timestamp: "2023-01-01T00:00:00Z",
            type: "deposit",
            amount: 6,
          },
        }),
      });
    });

    expect(result.current.safeCounts).toEqual([
      {
        id: "s2",
        user: "u",
        timestamp: "2023-01-01T00:00:00Z",
        type: "deposit",
        amount: 6,
      },
      {
        id: "s1",
        user: "u",
        timestamp: "2023-01-02T00:00:00Z",
        type: "deposit",
        amount: 5,
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("keeps previous counts and shows toast on invalid data", () => {
    const { result } = renderHook(() => useSafeCountsData());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({
          s1: {
            user: "u",
            timestamp: "2023-01-01T00:00:00Z",
            type: "deposit",
            amount: 1,
          },
        }),
      });
    });

    expect(result.current.safeCounts).toEqual([
      {
        id: "s1",
        user: "u",
        timestamp: "2023-01-01T00:00:00Z",
        type: "deposit",
        amount: 1,
      },
    ]);

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({ s1: { user: "u" } }),
      });
    });

    expect(result.current.safeCounts).toEqual([
      {
        id: "s1",
        user: "u",
        timestamp: "2023-01-01T00:00:00Z",
        type: "deposit",
        amount: 1,
      },
    ]);
    expect(result.current.error).not.toBeNull();
    expect(showToastMock).toHaveBeenCalledWith(
      expect.stringContaining("Validation failed"),
      "error"
    );
  });

  it("updates error state when firebase returns an error", () => {
    const { result } = renderHook(() => useSafeCountsData());

    act(() => {
      errCb?.("fail");
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.loading).toBe(false);
  });

  it("applies timestamp bounds when startAt/endAt are provided", () => {
    renderHook(() => useSafeCountsData({ startAt: "a", endAt: "b" }));
    expect(orderByChildMock).toHaveBeenCalledWith("timestamp");
    expect(startAtMock).toHaveBeenCalledWith("a");
    expect(endAtMock).toHaveBeenCalledWith("b");
  });
});
