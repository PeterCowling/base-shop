import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useGuestByRoomData from "../useGuestByRoomData";

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let snapCb:
  | ((snap: { exists: () => boolean; val: () => unknown }) => void)
  | null = null;
let errCb: ((err: unknown) => void) | null = null;

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  query: jest.fn((r: unknown) => r),
  orderByChild: jest.fn(() => undefined),
  startAt: jest.fn(() => undefined),
  endAt: jest.fn(() => undefined),
  limitToFirst: jest.fn(() => undefined),
  onValue: jest.fn((_: unknown, cb: typeof snapCb, err?: typeof errCb) => {
    snapCb = cb;
    errCb = err || null;
    return () => undefined;
  }),
}));

describe("useGuestByRoomData", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
