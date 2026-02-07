import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import useFirebaseSubscription from "../../useFirebaseSubscription";
import useActivitiesData from "../useActivitiesData";

jest.mock("../../useFirebaseSubscription");

const mockedSub = jest.mocked(useFirebaseSubscription);

describe("useActivitiesData (roomgrid)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards subscription data", () => {
    const sample = {
      OCC1: {
        a1: { code: 1, timestamp: "2025-01-01T00:00:00Z", who: "u" },
      },
    };

    mockedSub.mockReturnValue({ data: sample, loading: false, error: "e" });

    const { result } = renderHook(() => useActivitiesData());

    expect(result.current.activitiesData).toEqual(sample);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("e");
  });

  it("defaults to empty object when no data", () => {
    mockedSub.mockReturnValue({ data: null, loading: true, error: null });

    const { result } = renderHook(() => useActivitiesData());

    expect(result.current.activitiesData).toEqual({});
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
