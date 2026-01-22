import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useGuestByRoom from "../useGuestByRoom";

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  query: jest.fn((ref: unknown) => ref),
  orderByKey: jest.fn(),
  startAt: jest.fn(),
  endAt: jest.fn(),
  limitToFirst: jest.fn(),
  onValue: jest.fn((ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return jest.fn();
  }),
}));

describe("useGuestByRoom", () => {
  afterEach(() => {
    jest.clearAllMocks();
    callback = null;
  });

  it("returns parsed guest-by-room data", () => {
    const { result } = renderHook(() => useGuestByRoom());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({ occ1: { allocated: "1", booked: "1" } }),
      });
    });

    expect(result.current.guestByRoom).toEqual({
      occ1: { allocated: "1", booked: "1" },
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid guest by room data", () => {
    const { result } = renderHook(() => useGuestByRoom());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({ occ1: { allocated: 1 } }),
      });
    });

    expect(result.current.guestByRoom).toEqual({});
    expect(result.current.error).not.toBeNull();
  });
});
