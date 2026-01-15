import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useFirebaseSubscription from "../useFirebaseSubscription";
import { useSafeCountsList } from "../useSafeCountsList";

vi.mock("../useFirebaseSubscription");
vi.mock("../../../utils/toastUtils", () => ({ showToast: vi.fn() }));
import { showToast } from "../../../utils/toastUtils";

const mockedSub = vi.mocked(useFirebaseSubscription);
const showToastMock = showToast as unknown as ReturnType<typeof vi.fn>;

describe("useSafeCountsList", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed safe counts", () => {
    mockedSub.mockReturnValue({
      data: {
        s1: {
          user: "u",
          timestamp: "t",
          type: "deposit",
          amount: 10,
        },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useSafeCountsList());

    expect(result.current.safeCounts).toEqual([
      {
        id: "s1",
        user: "u",
        timestamp: "t",
        type: "deposit",
        amount: 10,
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("keeps previous list and shows toast on invalid data", () => {
    const state = {
      data: {
        s1: {
          user: "u",
          timestamp: "t",
          type: "deposit",
          amount: 10,
        },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    };
    mockedSub.mockImplementation(() => state);

    const { result, rerender } = renderHook(() => useSafeCountsList());

    expect(result.current.safeCounts).toEqual([
      {
        id: "s1",
        user: "u",
        timestamp: "t",
        type: "deposit",
        amount: 10,
      },
    ]);
    expect(result.current.error).toBeNull();

    state.data = { s1: { user: "u" } } as Record<string, unknown>;
    rerender();

    expect(result.current.safeCounts).toEqual([
      {
        id: "s1",
        user: "u",
        timestamp: "t",
        type: "deposit",
        amount: 10,
      },
    ]);
    expect(result.current.error).not.toBeNull();
    expect(showToastMock).toHaveBeenCalledWith(
      expect.stringContaining("Validation failed"),
      "error"
    );
  });
});
