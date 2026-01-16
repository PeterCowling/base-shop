import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* eslint-disable no-var */
var mockedSub: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../useFirebaseSubscription", () => {
  mockedSub = vi.fn();
  return { default: mockedSub };
});

import usePreorder from "../usePreorder";

describe("usePreorder", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns preorder data", () => {
    const data = {
      occ1: {
        night1: { breakfast: "A", drink1: "B", drink2: "C" },
      },
    };
    mockedSub.mockReturnValue({ data, loading: false, error: null });

    const { result } = renderHook(() => usePreorder());

    expect(result.current.preorder).toBe(data);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns null when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: true, error: null });
    const { result } = renderHook(() => usePreorder());
    expect(result.current.preorder).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("propagates errors", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: "oops" });
    const { result } = renderHook(() => usePreorder());
    expect(result.current.error).toBe("oops");
  });
});
