import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import type { CreditSlip } from "../../../../types/component/Till";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useCreditSlipsData } from "../useCreditSlipsData";

jest.mock("../../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useCreditSlipsData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps firebase record to array and forwards loading/error", () => {
    mockedSub.mockReturnValue({
      data: { id1: { amount: 5 } } as unknown as Record<string, CreditSlip>,
      loading: true,
      error: "err",
    });

    const { result } = renderHook(() => useCreditSlipsData());

    expect(result.current.creditSlips).toEqual([{ amount: 5 }]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("err");
  });
});
