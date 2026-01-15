import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../utils/toastUtils", () => ({ showToast: vi.fn() }));

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

interface SnapshotMock {
  exists: () => boolean;
  val: () => unknown;
}

let cb: ((snap: SnapshotMock) => void) | null = null;
let errCb: ((err: unknown) => void) | null = null;

vi.mock("firebase/database", () => {
  return {
    ref: vi.fn(() => ({})),
    query: vi.fn((r: unknown) => r),
    orderByChild: vi.fn(() => undefined),
    startAt: vi.fn(() => undefined),
    endAt: vi.fn(() => undefined),
    limitToFirst: vi.fn(() => undefined),
    onValue: vi.fn(
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

import { showToast } from "../../../utils/toastUtils";
import { orderByChild, startAt, endAt } from "firebase/database";
import { useSafeCountsData } from "../useSafeCountsData";

const showToastMock = showToast as unknown as ReturnType<typeof vi.fn>;
const orderByChildMock = orderByChild as unknown as ReturnType<typeof vi.fn>;
const startAtMock = startAt as unknown as ReturnType<typeof vi.fn>;
const endAtMock = endAt as unknown as ReturnType<typeof vi.fn>;

describe("useSafeCountsData", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
