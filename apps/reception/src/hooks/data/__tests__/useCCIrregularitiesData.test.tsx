import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { useCCIrregularitiesData } from "../useCCIrregularitiesData";
import useFirebaseSubscription from "../useFirebaseSubscription";

jest.mock("../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useCCIrregularitiesData", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
