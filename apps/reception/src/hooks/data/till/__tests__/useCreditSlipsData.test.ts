import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreditSlip } from "../../../../types/component/Till";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useCreditSlipsData } from "../useCreditSlipsData";

vi.mock("../../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useCreditSlipsData", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
