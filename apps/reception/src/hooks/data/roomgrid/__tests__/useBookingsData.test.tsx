import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useFirebaseSubscription from "../../useFirebaseSubscription";
import useBookingsData from "../useBookingsData";

jest.mock("../../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useBookingsData (roomgrid)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards subscription data", () => {
    mockedSub.mockReturnValue({
      data: {
        BR1: {
          OCC1: {
            checkInDate: "2025-01-01",
            checkOutDate: "2025-01-02",
            leadGuest: true,
            roomNumbers: ["101"],
          },
        },
      },
      loading: false,
      error: "e",
    });

    const { result } = renderHook(() => useBookingsData());

    expect(result.current.bookingsData).toEqual({
      BR1: {
        OCC1: {
          checkInDate: "2025-01-01",
          checkOutDate: "2025-01-02",
          leadGuest: true,
          roomNumbers: ["101"],
        },
      },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("e");
  });

  it("defaults to empty object when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: true, error: null });

    const { result } = renderHook(() => useBookingsData());

    expect(result.current.bookingsData).toEqual({});
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
