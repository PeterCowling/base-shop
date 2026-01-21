// File: src/hooks/client/checkin/__tests__/usePrepaymentData.test.tsx
import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/*  Register mocks first – Jest hoists `jest.mock` calls               */
/*  Each factory returns a new `jest.fn()` without touching outer scope  */
/* ------------------------------------------------------------------ */
jest.mock("../../../data/useActivitiesByCodeData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useActivitiesData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useBookingsData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useCCDetails", () => ({ default: jest.fn() }));
jest.mock("../../../data/useFinancialsRoom", () => ({ default: jest.fn() }));
jest.mock("../../../data/useGuestDetails", () => ({ default: jest.fn() }));

/* ------------------------------------------------------------------ */
/*  Import mocked modules *after* registration to access the spies     */
/* ------------------------------------------------------------------ */
import useActivitiesByCodeData from "../../../data/useActivitiesByCodeData";
import useActivitiesData from "../../../data/useActivitiesData";
import useBookingsData from "../../../data/useBookingsData";
import useCCDetails from "../../../data/useCCDetails";
import useFinancialsRoom from "../../../data/useFinancialsRoom";
import useGuestDetails from "../../../data/useGuestDetails";

/* Typed references to the mocked functions */
const useActivityByCodeMock = jest.mocked(useActivitiesByCodeData);
const useActivitiesMock = jest.mocked(useActivitiesData);
const useBookingsMock = jest.mocked(useBookingsData);
const useCCDetailsMock = jest.mocked(useCCDetails);
const useFinancialsRoomMock = jest.mocked(useFinancialsRoom);
const useGuestDetailsMock = jest.mocked(useGuestDetails);

/* ------------------------------------------------------------------ */
/*  Import the hook under test – mocks are already in place            */
/* ------------------------------------------------------------------ */
import usePrepaymentData, {
  computeHoursElapsed,
  findEarliestTimestampForCode,
} from "../usePrepaymentData";

/* ------------------------------------------------------------------ */
/*  Shared mock return data                                           */
/* ------------------------------------------------------------------ */
const baseData = {
  activitiesByCodes: {
    21: {
      occ1: {
        a1: { who: "sys", timestamp: "2024-01-01T10:00:00Z", description: "" },
      },
    },
    5: {
      occ1: {
        a2: { who: "sys", timestamp: "2024-01-01T11:00:00Z", description: "" },
      },
    },
    6: {
      occ1: {
        a3: { who: "sys", timestamp: "2023-12-31T12:00:00Z", description: "" },
      },
    },
  },
  activities: {},
  bookings: {
    BR1: {
      occ1: { leadGuest: true, checkInDate: "2024-06-01" },
      occ2: { leadGuest: false },
    },
    BR2: {
      occ3: { leadGuest: true },
    },
  },
  guestsDetails: {
    BR1: { occ1: { firstName: "Alice", lastName: "Smith" } },
    BR2: { occ3: { firstName: "Bob", lastName: "Brown" } },
  },
  ccData: { BR1: { occ1: { ccNum: "1111", expDate: "12/24" } } },
  financialsRoom: {
    BR1: {
      balance: 100,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {
        t1: {
          amount: 100,
          timestamp: "",
          nonRefundable: true,
          type: "charge",
          occupantId: "occ1",
          bookingRef: "BR1",
        },
      },
    },
    BR2: {
      balance: 200,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {
        t2: {
          amount: 200,

          timestamp: "",
          nonRefundable: false,
          type: "charge",
          occupantId: "occ3",
          bookingRef: "BR2",
        },
      },
    },
  },
};

/** Seed default mock return values */
function setBaseMockReturns(): void {
  useActivityByCodeMock.mockReturnValue({
    activitiesByCodes: baseData.activitiesByCodes,
    loading: false,
    error: null,
  });
  useActivitiesMock.mockReturnValue({
    activities: baseData.activities,
    loading: false,
    error: null,
  });
  useBookingsMock.mockReturnValue({
    bookings: baseData.bookings,
    loading: false,
    error: null,
  });
  useCCDetailsMock.mockReturnValue({
    ccData: baseData.ccData,
    loading: false,
    error: null,
  });
  useFinancialsRoomMock.mockReturnValue({
    financialsRoom: baseData.financialsRoom,
    loading: false,
    error: null,
  });
  useGuestDetailsMock.mockReturnValue({
    guestsDetails: baseData.guestsDetails,
    loading: false,
    error: null,
    validationError: null,
  });
}

/* ------------------------------------------------------------------ */
/*  Test suite                                                        */
/* ------------------------------------------------------------------ */
describe("usePrepaymentData", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-02T12:00:00Z"));
    setBaseMockReturns();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("computeHoursElapsed works", () => {
    expect(computeHoursElapsed("2024-01-02T10:00:00Z")).toBe(2);
    expect(computeHoursElapsed("2024-01-02T14:00:00Z")).toBe(0);
    expect(computeHoursElapsed(null)).toBeNull();
  });

  it("findEarliestTimestampForCode returns earliest match", () => {
    const arr = [
      { code: 5, timestamp: "2024-01-01T12:00:00Z" },
      { code: 5, timestamp: "2024-01-01T10:00:00Z" },
      { code: 6, timestamp: "2024-01-01T08:00:00Z" },
    ];
    const ts = findEarliestTimestampForCode(arr, 5);
    expect(ts).toBe("2024-01-01T10:00:00.000Z");
    expect(findEarliestTimestampForCode(arr, 7)).toBeNull();
  });

  it("filters relevantData by nonRefundable and lead guest", () => {
    const { result } = renderHook(() => usePrepaymentData());

    expect(result.current.relevantData.length).toBe(1);
    const item = result.current.relevantData[0];

    expect(item.bookingRef).toBe("BR1");
    expect(item.occupantId).toBe("occ1");
    expect(item.amountToCharge).toBe(100);
    expect(item.codes).toEqual(expect.arrayContaining([21, 5, 6]));
    expect(item.hoursElapsed21).toBe(26);
    expect(item.hoursElapsed5).toBe(25);
    expect(item.hoursElapsed6).toBe(48);
    expect(item.occupantName).toBe("Alice Smith");
    expect(item.ccCardNumber).toBe("1111");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reflects loading and error from data hooks", () => {
    /* Loading state */
    useBookingsMock.mockReturnValueOnce({
      bookings: {},
      loading: true,
      error: null,
    });

    const { result: loadingResult } = renderHook(() => usePrepaymentData());
    expect(loadingResult.current.loading).toBe(true);

    /* Error state */
    setBaseMockReturns();
    useFinancialsRoomMock.mockReturnValueOnce({
      financialsRoom: {},
      loading: false,
      error: "fail",
    });

    const { result: errorResult } = renderHook(() => usePrepaymentData());
    expect(errorResult.current.error).toBe("fail");
    expect(errorResult.current.loading).toBe(false);
  });
});
