import { renderHook, waitFor } from "@testing-library/react";

import useActivitiesData from "../useActivitiesData";

jest.mock("../../../services/useFirebase", () => {
  const db = {};
  return { useFirebaseDatabase: () => db };
});

const onValueMock = jest.fn();

jest.mock("firebase/database", () => ({
  ref: jest.fn(() => ({})),
  query: jest.fn((r: unknown) => r),
  orderByKey: jest.fn(),
  startAt: jest.fn(),
  endAt: jest.fn(),
  limitToFirst: jest.fn(),
  onValue: (
    ...args: unknown[]
  ) => onValueMock(...(args as [unknown, unknown, unknown])),
}));

type Snap = { exists: () => boolean; val: () => unknown };

describe("useActivitiesData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns activities on success and clears loading", async () => {
    const snap: Snap = {
      exists: () => true,
      val: () => ({
        occ1: { act1: { code: 1, timestamp: "t", who: "sys" } },
      }),
    };
    onValueMock.mockImplementation((_q, cb: (s: Snap) => void) => {
      cb(snap);
      return () => undefined;
    });

    const { result } = renderHook(() => useActivitiesData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activities).toEqual({
      occ1: { act1: { code: 1, timestamp: "t", who: "sys" } },
    });
    expect(result.current.error).toBeNull();
  });

  it("handles subscription errors", async () => {
    const error = new Error("fail");
    onValueMock.mockImplementation((_q, _cb, errCb: (e: Error) => void) => {
      errCb(error);
      return () => undefined;
    });

    const { result } = renderHook(() => useActivitiesData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.activities).toEqual({});
  });
});
