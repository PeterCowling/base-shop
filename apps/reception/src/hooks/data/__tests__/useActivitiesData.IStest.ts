import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useActivitiesData from "../useActivitiesData";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

type Snap = {
  exists: () => boolean;
  val: () => unknown;
};

let testSnap: Snap | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((ref: unknown) => ref),
  orderByKey: vi.fn(() => undefined),
  startAt: vi.fn(() => undefined),
  endAt: vi.fn(() => undefined),
  limitToFirst: vi.fn(() => undefined),
  onValue: vi.fn((_q: unknown, cb: (snap: Snap | null) => void) => {
    cb(testSnap);
    return () => undefined;
  }),
}));

describe("useActivitiesData", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
