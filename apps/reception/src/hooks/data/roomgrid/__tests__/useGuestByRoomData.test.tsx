import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useGuestByRoomData from "../useGuestByRoomData";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let snapCb:
  | ((snap: { exists: () => boolean; val: () => unknown }) => void)
  | null = null;
let errCb: ((err: unknown) => void) | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((r: unknown) => r),
  orderByChild: vi.fn(() => undefined),
  startAt: vi.fn(() => undefined),
  endAt: vi.fn(() => undefined),
  limitToFirst: vi.fn(() => undefined),
  onValue: vi.fn((_: unknown, cb: typeof snapCb, err?: typeof errCb) => {
    snapCb = cb;
    errCb = err || null;
    return () => undefined;
  }),
}));

describe("useGuestByRoomData", () => {
  afterEach(() => {
    vi.clearAllMocks();
    snapCb = null;
    errCb = null;
  });

  it("maps snapshot data", () => {
    const { result } = renderHook(() => useGuestByRoomData());

    act(() => {
      snapCb?.({
        exists: () => true,
        val: () => ({ OCC1: { allocated: "101", booked: "101" } }),
      });
    });

    expect(result.current.guestByRoomData).toEqual({
      OCC1: { allocated: "101", booked: "101" },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("defaults to empty object when snapshot missing", () => {
    const { result } = renderHook(() => useGuestByRoomData());

    act(() => {
      snapCb?.({ exists: () => false, val: () => null });
    });

    expect(result.current.guestByRoomData).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  it("handles firebase errors", () => {
    const { result } = renderHook(() => useGuestByRoomData());

    act(() => {
      errCb?.("fail");
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.loading).toBe(false);
  });
});
