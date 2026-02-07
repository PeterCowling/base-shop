import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useCheckouts } from "../useCheckouts";

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  query: jest.fn((refVal: unknown) => refVal),
  orderByChild: jest.fn(() => undefined),
  startAt: jest.fn(() => undefined),
  endAt: jest.fn(() => undefined),
  limitToFirst: jest.fn(() => undefined),
  onValue: jest.fn((_ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return () => undefined;
  }),
}));

describe("useCheckouts", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
