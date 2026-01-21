// src/hooks/data/__tests__/useCashCountsData.test.tsx
/* ------------------------------------------------------------------ */
/*  Tests for useCashCountsData & useSingleCashCount hooks             */
/* ------------------------------------------------------------------ */

import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";
import { cashCountsSchema } from "../../../schemas/cashCountSchema";
import { getErrorMessage } from "../../../utils/errorMessage";

/* ------------------------------------------------------------------ */
/*  Hoist‑safe mock placeholders                                       */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var firebaseMocks: {
  queryMock?: jest.Mock;
  orderByChildMock?: jest.Mock;
  startAtMock?: jest.Mock;
  endAtMock?: jest.Mock;
  limitToFirstMock?: jest.Mock;
};
var mockedSub: jest.Mock;
var cb: ((snap: unknown) => void) | null = null;
var errCb: ((err: unknown) => void) | null = null;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                       */
/* ------------------------------------------------------------------ */
jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("../useFirebaseSubscription", () => {
  mockedSub = jest.fn();
  return { default: mockedSub };
});

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

jest.mock("firebase/database", () => {
  // Initialise container for mock fns
  firebaseMocks = {};

  const queryMock = jest.fn((r: unknown) => r);
  const orderByChildMock = jest.fn();
  const startAtMock = jest.fn();
  const endAtMock = jest.fn();
  const limitToFirstMock = jest.fn();

  // Expose mocks for assertions
  Object.assign(firebaseMocks, {
    queryMock,
    orderByChildMock,
    startAtMock,
    endAtMock,
    limitToFirstMock,
  });

  return {
    getDatabase: jest.fn(() => ({})),
    ref: jest.fn(() => ({})),
    query: queryMock,
    orderByChild: orderByChildMock,
    startAt: startAtMock,
    endAt: endAtMock,
    limitToFirst: limitToFirstMock,
    onValue: jest.fn(
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
const showToastMock = showToast as unknown as jest.Mock;

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe("useCashCountsData", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
  afterEach(() => jest.clearAllMocks());

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
