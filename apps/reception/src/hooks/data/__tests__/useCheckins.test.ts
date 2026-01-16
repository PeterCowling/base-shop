import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCheckins } from "../useCheckins";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((ref: unknown) => ref),
  orderByChild: vi.fn(() => undefined),
  orderByKey: vi.fn(() => undefined),
  startAt: vi.fn(() => undefined),
  endAt: vi.fn(() => undefined),
  limitToFirst: vi.fn(() => undefined),
  onValue: vi.fn((ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return () => undefined;
  }),
}));

describe("useCheckins", () => {
  afterEach(() => {
    vi.clearAllMocks();
    callback = null;
  });

  it("returns parsed checkins", () => {
    const { result } = renderHook(() => useCheckins());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({
          "2024-06-01": {
            occ1: { reservationCode: "R1", timestamp: "t" },
          },
        }),
      });
    });

    expect(result.current.checkins).toEqual({
      "2024-06-01": { occ1: { reservationCode: "R1", timestamp: "t" } },
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid checkin data", () => {
    const { result } = renderHook(() => useCheckins());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({ "2024-06-01": { occ1: { timestamp: 123 } } }),
      });
    });

    expect(result.current.checkins).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
