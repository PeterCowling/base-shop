import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";

import { useCheckins } from "../useCheckins";

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  query: jest.fn((ref: unknown) => ref),
  orderByChild: jest.fn(() => undefined),
  orderByKey: jest.fn(() => undefined),
  startAt: jest.fn(() => undefined),
  endAt: jest.fn(() => undefined),
  limitToFirst: jest.fn(() => undefined),
  onValue: jest.fn((ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return () => undefined;
  }),
}));

describe("useCheckins", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
