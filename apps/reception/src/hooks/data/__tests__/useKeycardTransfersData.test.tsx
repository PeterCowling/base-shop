import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useFirebaseSubscription from "../useFirebaseSubscription";
import { useKeycardTransfersData } from "../useKeycardTransfersData";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useKeycardTransfersData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns keycard transfers", () => {
    mockedSub.mockReturnValue({
      data: {
        k1: { user: "u", timestamp: "t", count: 2, direction: "fromSafe" },
      },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useFirebaseSubscription>);

    const { result } = renderHook(() => useKeycardTransfersData());

    expect(result.current.transfers).toEqual([
      { user: "u", timestamp: "t", count: 2, direction: "fromSafe" },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("handles missing data", () => {
    mockedSub.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useFirebaseSubscription>);

    const { result } = renderHook(() => useKeycardTransfersData());

    expect(result.current.transfers).toEqual([]);
  });
});
