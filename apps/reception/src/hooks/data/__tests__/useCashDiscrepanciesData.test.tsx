import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCashDiscrepanciesData } from "../useCashDiscrepanciesData";
import useFirebaseSubscription from "../useFirebaseSubscription";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useCashDiscrepanciesData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed cash discrepancies", () => {
    mockedSub.mockReturnValue({
      data: {
        d1: { user: "u", timestamp: "t", amount: 5 },
      },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useCashDiscrepanciesData());

    expect(result.current.cashDiscrepancies).toEqual([
      { user: "u", timestamp: "t", amount: 5 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid cash discrepancy data", () => {
    mockedSub.mockReturnValue({
      data: { d1: { user: "u" } },
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useCashDiscrepanciesData());

    expect(result.current.cashDiscrepancies).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });
});
