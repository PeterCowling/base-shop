import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useFirebaseSubscription from "../../useFirebaseSubscription";
import useGuestsDetailsData from "../useGuestsDetailsData";

jest.mock("../../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useGuestsDetailsData", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns data from subscription", () => {
    mockedSub.mockReturnValue({
      data: {
        BR1: {
          OCC1: {
            firstName: "John",
            lastName: "Doe",
            citizenship: "US",
            dateOfBirth: { dd: "01", mm: "01", yyyy: "2000" },
            document: { number: "A", type: "pass" },
            email: "a@b.c",
            gender: "M",
            language: "en",
            municipality: "",
            placeOfBirth: "",
          },
        },
      },
      loading: false,
      error: "err",
    });

    const { result } = renderHook(() => useGuestsDetailsData());

    expect(result.current.guestsDetailsData).toHaveProperty("BR1");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("err");
  });

  it("defaults to empty object when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: true, error: null });

    const { result } = renderHook(() => useGuestsDetailsData());

    expect(result.current.guestsDetailsData).toEqual({});
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
