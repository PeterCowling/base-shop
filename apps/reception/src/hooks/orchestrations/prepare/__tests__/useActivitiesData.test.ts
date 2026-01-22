import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { useActivitiesData } from "../useActivitiesData";

type MockResult<T> = { data: T | null; loading: boolean; error: unknown };
let mockResult: MockResult<Record<string, unknown>>;

jest.mock("../../../data/useFirebaseSubscription", () => ({
  default: () => mockResult,
}));

describe("useActivitiesData", () => {
  it("parses activities", () => {
    mockResult = {
      data: { occ1: { a1: { code: 1, timestamp: "t1", who: "sys" } } },
      loading: false,
      error: null,
    };
    const { result } = renderHook(() => useActivitiesData());
    expect(result.current.activities).toEqual({
      occ1: { a1: { code: 1, timestamp: "t1", who: "sys" } },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("propagates loading and error", () => {
    const err = new Error("fail");
    mockResult = { data: null, loading: true, error: err };
    const { result } = renderHook(() => useActivitiesData());
    expect(result.current.activities).toEqual({});
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(err);
  });
});
