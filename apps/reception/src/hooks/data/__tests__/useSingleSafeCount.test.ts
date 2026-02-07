import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import type { SafeCount } from "../../../types/hooks/data/safeCountData";
import useFirebaseSubscription from "../useFirebaseSubscription";
import { useSingleSafeCount } from "../useSafeCountsData";

jest.mock("../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useSingleSafeCount", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("subscribes to safeCounts/abc and returns the record", () => {
    mockedSub.mockReturnValue({
      data: { user: "u", timestamp: "t", type: "deposit" } as SafeCount,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useSingleSafeCount("abc"));

    expect(mockedSub.mock.calls[0][0]).toBe("safeCounts/abc");
    expect(result.current.singleSafeCount).toEqual({
      user: "u",
      timestamp: "t",
      type: "deposit",
    });
    expect(result.current.error).toBeNull();
  });

  it("passes empty path and returns null", () => {
    mockedSub.mockReturnValue({ data: null, loading: false, error: null });

    const { result } = renderHook(() => useSingleSafeCount(""));

    expect(mockedSub.mock.calls[0][0]).toBe("");
    expect(result.current.singleSafeCount).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
