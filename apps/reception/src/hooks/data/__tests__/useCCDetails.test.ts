import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ccDataSchema } from "../../../schemas/ccDataSchema";
import useCCDetails from "../useCCDetails";
import useFirebaseSubscription from "../useFirebaseSubscription";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useCCDetails", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed credit card data", () => {
    const raw = {
      BR1: { occ1: { ccNum: "4111", expDate: "12/30" } },
    };
    mockedSub.mockReturnValue({ data: raw, loading: false, error: null });

    const { result } = renderHook(() => useCCDetails());

    expect(result.current.ccData).toEqual(ccDataSchema.parse(raw));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid data", () => {
    const bad = {
      BR1: { occ1: { ccNum: 5 } },
    } as unknown as Record<string, unknown>;
    mockedSub.mockReturnValue({ data: bad, loading: false, error: null });

    const { result } = renderHook(() => useCCDetails());

    expect(result.current.ccData).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBeNull();
  });
});
