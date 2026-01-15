import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* eslint-disable no-var */
var cb: ((snap: unknown) => void) | null = null;
var errCb: ((err: unknown) => void) | null = null;
var queryMocks: {
  startAt?: ReturnType<typeof vi.fn>;
  endAt?: ReturnType<typeof vi.fn>;
  limitToFirst?: ReturnType<typeof vi.fn>;
  orderByKey?: ReturnType<typeof vi.fn>;
};
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

vi.mock("firebase/database", () => {
  const startAtMock = vi.fn((r: unknown) => r);
  const endAtMock = vi.fn((r: unknown) => r);
  const limitToFirstMock = vi.fn((r: unknown) => r);
  const orderByKeyMock = vi.fn((r: unknown) => r);
  queryMocks = { startAt: startAtMock, endAt: endAtMock, limitToFirst: limitToFirstMock, orderByKey: orderByKeyMock };
  return {
    ref: vi.fn(() => ({})),
    query: vi.fn((r: unknown) => r),
    orderByKey: orderByKeyMock,
    startAt: startAtMock,
    endAt: endAtMock,
    limitToFirst: limitToFirstMock,
    onValue: vi.fn((r: unknown, onData: (snap: unknown) => void, onError: (err: unknown) => void) => {
      cb = onData;
      errCb = onError;
      return () => undefined;
    }),
  };
});

import useCityTax from "../useCityTax";

describe("useCityTax", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cb = null;
    errCb = null;
  });

  it("returns parsed city tax data", () => {
    const { result } = renderHook(() => useCityTax());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({
          b1: { o1: { balance: 1, totalDue: 2, totalPaid: 3 } },
        }),
      });
    });

    expect(result.current.cityTax).toEqual({
      b1: { o1: { balance: 1, totalDue: 2, totalPaid: 3 } },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles empty snapshot", () => {
    const { result } = renderHook(() => useCityTax());

    act(() => {
      cb?.({ exists: () => false });
    });

    expect(result.current.cityTax).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid data", () => {
    const { result } = renderHook(() => useCityTax());

    act(() => {
      cb?.({
        exists: () => true,
        val: () => ({ b1: { o1: { balance: 1 } } }),
      });
    });

    expect(result.current.cityTax).toEqual({});
    expect(result.current.error).not.toBeNull();
  });

  it("updates error state when firebase returns an error", () => {
    const { result } = renderHook(() => useCityTax());

    act(() => {
      errCb?.("fail");
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.loading).toBe(false);
  });

  it("respects query params", () => {
    renderHook(() =>
      useCityTax({ startAt: "a", endAt: "b", limitToFirst: 1 })
    );
    expect(queryMocks.startAt).toHaveBeenCalledWith("a");
    expect(queryMocks.endAt).toHaveBeenCalledWith("b");
    expect(queryMocks.limitToFirst).toHaveBeenCalledWith(1);
    expect(queryMocks.orderByKey).toHaveBeenCalled();
  });
});
