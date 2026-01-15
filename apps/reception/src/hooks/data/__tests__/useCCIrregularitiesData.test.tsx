import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCCIrregularitiesData } from "../useCCIrregularitiesData";
import useFirebaseSubscription from "../useFirebaseSubscription";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useCCIrregularitiesData", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed irregularities", () => {
    mockedSub.mockReturnValue({
      data: {
        i1: { user: "u", timestamp: "t", action: "close", missingCount: 1 },
      },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useFirebaseSubscription>);

    const { result } = renderHook(() => useCCIrregularitiesData());

    expect(result.current.ccIrregularities).toEqual([
      { user: "u", timestamp: "t", action: "close", missingCount: 1 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid data", () => {
    mockedSub.mockReturnValue({
      data: { i1: { user: "u" } },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useFirebaseSubscription>);

    const { result } = renderHook(() => useCCIrregularitiesData());

    expect(result.current.ccIrregularities).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });
});
