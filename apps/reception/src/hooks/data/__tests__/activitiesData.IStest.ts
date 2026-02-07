import { renderHook, waitFor } from "@testing-library/react";
import { afterEach,describe, expect, it, vi } from "vitest";

import useActivitiesData from "../useActivitiesData";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

const onValueMock = vi.fn();

vi.mock("firebase/database", () => ({
  ref: vi.fn(() => ({})),
  query: vi.fn((r: unknown) => r),
  orderByKey: vi.fn(),
  startAt: vi.fn(),
  endAt: vi.fn(),
  limitToFirst: vi.fn(),
  onValue: (
    ...args: unknown[]
  ) => onValueMock(...(args as [unknown, unknown, unknown])),
}));

type Snap = { exists: () => boolean; val: () => unknown };

describe("useActivitiesData", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
