import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useGuestByRoom from "../useGuestByRoom";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((ref: unknown) => ref),
  orderByKey: vi.fn(),
  startAt: vi.fn(),
  endAt: vi.fn(),
  limitToFirst: vi.fn(),
  onValue: vi.fn((ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return vi.fn();
  }),
}));

describe("useGuestByRoom", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
