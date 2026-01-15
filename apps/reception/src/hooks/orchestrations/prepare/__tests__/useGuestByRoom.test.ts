import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGuestByRoom } from "../useGuestByRoom";

type MockResult<T> = { data: T | null; loading: boolean; error: unknown };
let mockResult: MockResult<Record<string, { allocated: string; booked: string }>>;

vi.mock("../../../data/useFirebaseSubscription", () => ({
  default: () => mockResult,
}));

describe("useGuestByRoom", () => {
  it("returns guest mapping", () => {
    mockResult = {
      data: { occ1: { allocated: "3", booked: "3" } },
      loading: false,
      error: null,
    };
    const { result } = renderHook(() => useGuestByRoom());
    expect(result.current.guestByRoom).toEqual(mockResult.data);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("propagates loading and error", () => {
    const err = new Error("fail");
    mockResult = { data: null, loading: true, error: err };
    const { result } = renderHook(() => useGuestByRoom());
    expect(result.current.guestByRoom).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(err);
  });
});
