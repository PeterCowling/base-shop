import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import useInHouseGuestsByRoom from "../useInHouseGuestsByRoom";

type ActivitiesResult = {
  activitiesByCodes: Record<string, Record<string, Record<string, { timestamp: string }>>> | null;
  loading: boolean;
  error: unknown;
};
let activitiesResult: ActivitiesResult;

type GuestResult = {
  guestByRoom: Record<string, { allocated: string }> | null;
  loading: boolean;
  error: unknown;
};
let guestResult: GuestResult;

jest.mock("../../../data/useActivitiesByCodeData", () => ({
  default: () => activitiesResult,
}));
jest.mock("../../../data/useGuestByRoom", () => ({
  default: () => guestResult,
}));

describe("useInHouseGuestsByRoom", () => {
  it("maps occupants to rooms", () => {
    activitiesResult = {
      activitiesByCodes: {
        "12": { occ1: { a1: { timestamp: "2024-06-01T10:00:00Z" } } },
        "14": { occ2: { a1: { timestamp: "2024-06-02T10:00:00Z" } } },
      },
      loading: false,
      error: null,
    };
    guestResult = {
      guestByRoom: {
        occ1: { allocated: "3" },
        occ2: { allocated: "4" },
      },
      loading: false,
      error: null,
    };
    const { result } = renderHook(() => useInHouseGuestsByRoom("2024-06-02"));
    expect(result.current.roomsData["3"]).toEqual(["occ1"]);
    expect(result.current.roomsData["4"]).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("propagates loading and error", () => {
    const err = new Error("fail");
    activitiesResult = {
      activitiesByCodes: null,
      loading: true,
      error: err,
    };
    guestResult = { guestByRoom: null, loading: false, error: null };
    const { result } = renderHook(() => useInHouseGuestsByRoom("2024-06-02"));
    expect(result.current.roomsData).toEqual({});
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(err);
  });
});
