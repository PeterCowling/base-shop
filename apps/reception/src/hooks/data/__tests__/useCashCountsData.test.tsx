// src/hooks/data/__tests__/useCashCountsData.test.tsx
/* eslint-env vitest */
/* ------------------------------------------------------------------ */
/*  Tests for useCashCountsData & useSingleCashCount hooks             */
/* ------------------------------------------------------------------ */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cashCountsSchema } from "../../../schemas/cashCountSchema";
import { getErrorMessage } from "../../../utils/errorMessage";

/* ------------------------------------------------------------------ */
/*  Hoist‑safe mock placeholders                                       */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var firebaseMocks: {
  queryMock?: ReturnType<typeof vi.fn>;
  orderByChildMock?: ReturnType<typeof vi.fn>;
  startAtMock?: ReturnType<typeof vi.fn>;
  endAtMock?: ReturnType<typeof vi.fn>;
  limitToFirstMock?: ReturnType<typeof vi.fn>;
};
var mockedSub: ReturnType<typeof vi.fn>;
var cb: ((snap: unknown) => void) | null = null;
var errCb: ((err: unknown) => void) | null = null;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                       */
/* ------------------------------------------------------------------ */
vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

vi.mock("../useFirebaseSubscription", () => {
  mockedSub = vi.fn();
  return { default: mockedSub };
});

vi.mock("../../../utils/toastUtils", () => ({ showToast: vi.fn() }));

vi.mock("firebase/database", () => {
  // Initialise container for mock fns
  firebaseMocks = {};

  const queryMock = vi.fn((r: unknown) => r);
  const orderByChildMock = vi.fn();
  const startAtMock = vi.fn();
  const endAtMock = vi.fn();
  const limitToFirstMock = vi.fn();

  // Expose mocks for assertions
  Object.assign(firebaseMocks, {
    queryMock,
    orderByChildMock,
    startAtMock,
    endAtMock,
    limitToFirstMock,
  });

  return {
    getDatabase: vi.fn(() => ({})),
    ref: vi.fn(() => ({})),
    query: queryMock,
    orderByChild: orderByChildMock,
    startAt: startAtMock,
    endAt: endAtMock,
    limitToFirst: limitToFirstMock,
    onValue: vi.fn(
      (
        _ref: unknown,
        onData: (snap: unknown) => void,
        onError: (err: unknown) => void
      ) => {
        cb = onData;
        errCb = onError;
        return () => undefined; // unsubscribe
      }
    ),
  };
});

/* ------------------------------------------------------------------ */
/*  Imports under test (after mocks)                                   */
/* ------------------------------------------------------------------ */
import { useCashCountsData, useSingleCashCount } from "../useCashCountsData";
import { showToast } from "../../../utils/toastUtils";
const showToastMock = showToast as unknown as ReturnType<typeof vi.fn>;

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe("useCashCountsData", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cb = null;
    errCb = null;
  });

  it("returns parsed cash counts", () => {
    const { result } = renderHook(() => useCashCountsData());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({
          c1: {
            user: "u",
            timestamp: "t",
            type: "opening",
            count: 1,
            denomBreakdown: { "50": 2 },
          },
        }),
      });
    });

    expect(result.current.cashCounts).toEqual([
      {
        user: "u",
        timestamp: "t",
        type: "opening",
        count: 1,
        denomBreakdown: { "50": 2 },
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("sorts cash counts by timestamp", () => {
    const { result } = renderHook(() => useCashCountsData());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({
          c2: {
            user: "u",
            timestamp: "2024-01-02T00:00:00Z",
            type: "close",
            count: 2,
          },
          c1: {
            user: "u",
            timestamp: "2024-01-01T00:00:00Z",
            type: "opening",
            count: 1,
          },
        }),
      });
    });

    expect(result.current.cashCounts).toEqual([
      {
        user: "u",
        timestamp: "2024-01-01T00:00:00Z",
        type: "opening",
        count: 1,
      },
      {
        user: "u",
        timestamp: "2024-01-02T00:00:00Z",
        type: "close",
        count: 2,
      },
    ]);
  });

  it("retains previous data and shows toast on invalid cash counts", () => {
    const { result } = renderHook(() => useCashCountsData());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({
          c1: {
            user: "u",
            timestamp: "t",
            type: "opening",
            count: 1,
            denomBreakdown: { "50": 2 },
          },
        }),
      });
    });

    const validSnapshot = result.current.cashCounts;

    const invalidData = { c1: { user: "u" } };
    const parseResult = cashCountsSchema.safeParse(invalidData);
    const expectedMsg = getErrorMessage(parseResult.error);

    act(() => {
      cb?.({ exists: () => true, val: () => invalidData });
    });

    expect(result.current.cashCounts).toEqual(validSnapshot);
    expect(result.current.error).not.toBeNull();
    expect(showToastMock).toHaveBeenCalledWith(expectedMsg, "error");
  });

  it("updates error state when firebase returns an error", () => {
    const { result } = renderHook(() => useCashCountsData());

    act(() => {
      errCb?.("fail");
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.loading).toBe(false);
  });

  it("respects query options", () => {
    renderHook(() =>
      useCashCountsData({
        orderByChild: "timestamp",
        startAt: "a",
        endAt: "b",
        limitToFirst: 2,
      })
    );

    expect(firebaseMocks.orderByChildMock).toHaveBeenCalledWith("timestamp");
    expect(firebaseMocks.startAtMock).toHaveBeenCalledWith("a");
    expect(firebaseMocks.endAtMock).toHaveBeenCalledWith("b");
    expect(firebaseMocks.limitToFirstMock).toHaveBeenCalledWith(2);
  });
});

describe("useSingleCashCount", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns the specific record", () => {
    mockedSub.mockReturnValue({
      data: { user: "u", timestamp: "t", type: "opening" },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useSingleCashCount("c1"));

    expect(result.current.singleCashCount).toEqual({
      user: "u",
      timestamp: "t",
      type: "opening",
    });
    expect(result.current.error).toBeNull();
  });

  it("returns null when record missing", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: null });

    const { result } = renderHook(() => useSingleCashCount("c1"));

    expect(result.current.singleCashCount).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
