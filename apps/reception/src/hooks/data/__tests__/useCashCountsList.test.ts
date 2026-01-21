import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import { cashCountsSchema } from "../../../schemas/cashCountSchema";
import { getErrorMessage } from "../../../utils/errorMessage";

import { useCashCountsList } from "../useCashCountsList";

/* eslint-disable no-var */
let subData: Record<string, unknown> | null = null;
let subError: unknown = null;
/* eslint-enable no-var */

jest.mock("../useFirebaseSubscription", () => ({
  __esModule: true,
  default: () => ({ data: subData, loading: false, error: subError }),
}));
jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));
import { showToast } from "../../../utils/toastUtils";
const showToastMock = showToast as unknown as jest.Mock;

describe("useCashCountsList", () => {
  afterEach(() => {
    jest.clearAllMocks();
    subData = null;
    subError = null;
  });

  it("returns parsed cash counts", () => {
    subData = {
      c1: {
        user: "u",
        timestamp: "t",
        type: "opening",
        count: 1,
        difference: 0,
      },
    };

    const { result } = renderHook(() => useCashCountsList());

    expect(result.current.cashCounts).toEqual([
      {
        user: "u",
        timestamp: "t",
        type: "opening",
        count: 1,
        difference: 0,
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("retains previous data and shows toast on invalid cash counts list", () => {
    subData = {
      c1: {
        user: "u",
        timestamp: "t",
        type: "opening",
        count: 1,
        difference: 0,
      },
    };

    const { result, rerender } = renderHook(() => useCashCountsList());

    const validSnapshot = result.current.cashCounts;

    const invalidData = { c1: { user: "u" } };
    const parseResult = cashCountsSchema.safeParse(invalidData);
    const expectedMsg = getErrorMessage(parseResult.error);

    subData = invalidData;
    rerender();

    expect(result.current.cashCounts).toEqual(validSnapshot);
    expect(result.current.error).not.toBeNull();
    expect(showToastMock).toHaveBeenCalledWith(expectedMsg, "error");
  });
});
