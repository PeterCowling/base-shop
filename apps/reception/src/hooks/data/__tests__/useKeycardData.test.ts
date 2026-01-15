import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useFirebaseSubscription from "../useFirebaseSubscription";
import useKeycardData from "../useKeycardData";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useKeycardData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("computes keycard count and cash deposits", () => {
    mockedSub.mockReturnValue({
      data: {
        t1: { item: "keycard", deposit: 10, count: 1, method: "CASH" },
        t2: { item: "keycard", deposit: -10, count: 1, method: "CASH" },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useKeycardData("B", "O"));

    expect(result.current).toEqual({ keycardCount: 0, totalCashDeposits: 0 });
  });

  it("ignores invalid transactions", () => {
    mockedSub.mockReturnValue({
      data: {
        t1: { item: "keycard", deposit: 10, count: 1, method: "CASH" },
        t2: { item: "keycard", deposit: "bad" } as unknown,
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useKeycardData("B", "O"));

    expect(result.current).toEqual({ keycardCount: 1, totalCashDeposits: 10 });
  });
});
