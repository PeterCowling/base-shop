import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useFirebaseSubscription from "../useFirebaseSubscription";
import { useKeycardDiscrepanciesData } from "../useKeycardDiscrepanciesData";

jest.mock("../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useKeycardDiscrepanciesData", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
