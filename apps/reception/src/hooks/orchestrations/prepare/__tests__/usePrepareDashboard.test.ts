import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import usePrepareDashboardData from "../usePrepareDashboard";

type RoomsResult = { roomsByDate: Record<string, unknown> | null; mergedOccupancyData: Record<string, unknown>; loading: boolean; error: unknown };
let roomsResult: RoomsResult;

type StatusResult = { roomStatusMap: Record<string, unknown> | null; loading: boolean; error: unknown };
let statusResult: StatusResult;

type CheckinsResult = { checkins: Record<string, unknown> | null; loading: boolean; error: unknown };
let checkinsResult: CheckinsResult;

type GuestResult = { guestByRoom: Record<string, { allocated: string; booked: string }> | null; loading: boolean; error: unknown };
let guestResult: GuestResult;

type ActivitiesResult = { activities: Record<string, unknown>; loading: boolean; error: unknown };
let activitiesResult: ActivitiesResult;

const saveRoomStatus = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../data/useRoomsByDate", () => ({
  default: () => roomsResult,
}));
jest.mock("../../../data/useRoomStatus", () => ({
  default: () => statusResult,
}));
jest.mock("../../../data/useCheckins", () => ({
  useCheckins: () => checkinsResult,
}));
jest.mock("../../../data/useGuestByRoom", () => ({
  default: () => guestResult,
}));
jest.mock("../../../mutations/useRoomStatusMutations", () => ({
  default: () => ({ saveRoomStatus }),
}));
jest.mock("../useActivitiesData", () => ({
  useActivitiesData: () => activitiesResult,
}));
jest.mock("../../../../utils/dateUtils", async () => {
  const actual = jest.requireActual(
    "../../../../utils/dateUtils"
  );
  return {
    ...actual,
    getLocalToday: () => "2024-06-02",
    parseLocalDate: (s: string) => new Date(`${s}T00:00:00Z`),
    getLocalYyyyMmDd: (d: Date) => actual.getItalyIsoString(d).slice(0, 10),
    getItalyIsoString: () => "2024-06-02T00:00:00Z",
    isToday: (d: string) => d === "2024-06-02",
  };
});

describe("usePrepareDashboard", () => {
  beforeEach(() => {
    roomsResult = {
      roomsByDate: {
        "2024-06-02": { index_3: { r1: { guestIds: ["occ1"] } } },
        "2024-06-01": { index_3: { r0: { guestIds: ["occ1", "occ2"] } } },
      },
      mergedOccupancyData: {},
      loading: false,
      error: null,
    };
    statusResult = {
      roomStatusMap: { index_3: { clean: false } },
      loading: false,
      error: null,
    };
    checkinsResult = {
      checkins: {
        "2024-06-02": { occ1: { reservationCode: "BR1", timestamp: "t" } },
      },
      loading: false,
      error: null,
    };
    guestResult = {
      guestByRoom: { occ1: { allocated: "3", booked: "3" } },
      loading: false,
      error: null,
    };
    activitiesResult = {
      activities: { occ1: { a1: { code: 1, timestamp: "2024-06-02T09:00:00Z", who: "s" } } },
      loading: false,
      error: null,
    };
    saveRoomStatus.mockReset();
  });

  it("computes occupancy data and summaries", () => {
    const { result } = renderHook(() => usePrepareDashboardData("2024-06-02"));
    const room3 = result.current.mergedData.find((r) => r.roomNumber === "3");
    expect(room3).toEqual({
      roomNumber: "3",
      occupantCount: 1,
      wasOccupiedYesterday: true,
      localCleanliness: "Dirty",
      finalCleanliness: "Dirty",
    });
    expect(result.current.totalInRoomsYesterday).toBe(1);
    expect(result.current.totalCheckInsToday).toBe(1);
    expect(result.current.totalBeds).toBe(55);
    expect(result.current.totalFreeBeds).toBe(53);
    expect(result.current.occupancyRate).toBeCloseTo((2 / 55) * 100);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.noRoomsData).toBe(false);
    expect(result.current.noCheckinsData).toBe(false);
  });

  it("reflects loading and error", () => {
    const err = new Error("boom");
    roomsResult = { roomsByDate: null, mergedOccupancyData: {}, loading: true, error: null };
    checkinsResult = { checkins: null, loading: false, error: err };
    const { result } = renderHook(() => usePrepareDashboardData("2024-06-02"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(err);
    expect(result.current.noRoomsData).toBe(true);
  });
});
