import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useBookingNotes from "../useBookingNotes";
import useFirebaseSubscription from "../useFirebaseSubscription";

vi.mock("../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useBookingNotes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed notes when data valid", () => {
    mockedSub.mockReturnValue({
      data: {
        n1: { text: "t", timestamp: "now", user: "u" },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBookingNotes("b1"));

    expect(result.current.notes).toEqual({
      n1: { text: "t", timestamp: "now", user: "u" },
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid booking notes data", () => {
    mockedSub.mockReturnValue({
      data: {
        n1: { text: 5 },
      } as Record<string, unknown>,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useBookingNotes("b1"));

    expect(result.current.notes).toEqual({});
    expect(result.current.error).not.toBeNull();
  });
});
