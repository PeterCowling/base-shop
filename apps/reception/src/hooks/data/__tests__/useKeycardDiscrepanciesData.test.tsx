import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useFirebaseSubscription from "../useFirebaseSubscription";
import { useKeycardDiscrepanciesData } from "../useKeycardDiscrepanciesData";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useKeycardDiscrepanciesData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed keycard discrepancies", () => {
    mockedSub.mockReturnValue({
      data: { k1: { user: "u", timestamp: "t", amount: 1 } },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useFirebaseSubscription>);

    const { result } = renderHook(() => useKeycardDiscrepanciesData());

    expect(result.current.keycardDiscrepancies).toEqual([
      { user: "u", timestamp: "t", amount: 1 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid data", () => {
    mockedSub.mockReturnValue({
      data: { k1: { user: "u" } },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useFirebaseSubscription>);

    const { result } = renderHook(() => useKeycardDiscrepanciesData());

    expect(result.current.keycardDiscrepancies).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });
});
