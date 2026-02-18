import { renderHook, waitFor } from "@testing-library/react";

import useActivitiesData from "../useActivitiesData";

jest.mock("../../../services/useFirebase", () => {
  const db = {};
  return { useFirebaseDatabase: () => db };
});

type Snap = {
  exists: () => boolean;
  val: () => unknown;
};

let testSnap: Snap | null = null;

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  query: jest.fn((ref: unknown) => ref),
  orderByKey: jest.fn(() => undefined),
  startAt: jest.fn(() => undefined),
  endAt: jest.fn(() => undefined),
  limitToFirst: jest.fn(() => undefined),
  onValue: jest.fn((_q: unknown, cb: (snap: Snap | null) => void) => {
    cb(testSnap);
    return () => undefined;
  }),
}));

describe("useActivitiesData", () => {
  afterEach(() => {
    jest.clearAllMocks();
    testSnap = null;
  });

  it("parses valid activities and sets loading false", async () => {
    testSnap = {
      exists: () => true,
      val: () => ({
        occ1: {
          act1: { code: 1, timestamp: "t", who: "sys" },
        },
      }),
    };

    const { result } = renderHook(() => useActivitiesData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activities).toEqual({
      occ1: {
        act1: { code: 1, timestamp: "t", who: "sys" },
      },
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error when child entries are invalid", async () => {
    testSnap = {
      exists: () => true,
      val: () => ({
        occ1: {
          act1: { code: "bad", who: "sys" },
        },
      }),
    };

    const { result } = renderHook(() => useActivitiesData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
  });
});
