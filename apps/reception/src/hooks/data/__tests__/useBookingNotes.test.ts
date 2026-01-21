import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useBookingNotes from "../useBookingNotes";
import useFirebaseSubscription from "../useFirebaseSubscription";

jest.mock("../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useBookingNotes", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
