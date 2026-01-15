import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCheckouts } from "../useCheckouts";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((refVal: unknown) => refVal),
  orderByChild: vi.fn(() => undefined),
  startAt: vi.fn(() => undefined),
  endAt: vi.fn(() => undefined),
  limitToFirst: vi.fn(() => undefined),
  onValue: vi.fn((_ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return () => undefined;
  }),
}));

describe("useCheckouts", () => {
  afterEach(() => {
    vi.clearAllMocks();
    callback = null;
  });

  it("returns parsed checkouts", () => {
    const { result } = renderHook(() => useCheckouts());

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

    expect(result.current.checkouts).toEqual({
      "2024-06-01": { occ1: { reservationCode: "R1", timestamp: "t" } },
    });
    expect(result.current.error).toBeNull();
  });

  it("parses data with notes", () => {
    const { result } = renderHook(() => useCheckouts());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({
          "2024-06-01": {
            occ1: {
              reservationCode: "R1",
              timestamp: "t",
              __notes: {
                n1: { text: "hi", timestamp: "t", user: "u" },
              },
            },
          },
        }),
      });
    });

    expect(result.current.checkouts).toEqual({
      "2024-06-01": {
        occ1: {
          reservationCode: "R1",
          timestamp: "t",
          __notes: { n1: { text: "hi", timestamp: "t", user: "u" } },
        },
      },
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid checkout data", () => {
    const { result } = renderHook(() => useCheckouts());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({
          "2024-06-01": {
            occ1: {
              timestamp: 123,
              __notes: { n1: { text: 5 } },
            },
          },
        }),
      });
    });

    expect(result.current.checkouts).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
