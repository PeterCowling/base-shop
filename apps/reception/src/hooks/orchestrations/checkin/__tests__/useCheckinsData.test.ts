// File: src/hooks/orchestrations/checkin/__tests__/useCheckinsData.test.ts
import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/*  Module mocks – declared first so Vitest can safely hoist them     */
/*  (no references to outer‑scope variables inside the factory)       */
/* ------------------------------------------------------------------ */
jest.mock("../../../data/useBookingsData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useGuestDetails", () => ({ default: jest.fn() }));
jest.mock("../../../data/useFinancialsRoom", () => ({ default: jest.fn() }));
jest.mock("../../../data/useCityTax", () => ({ default: jest.fn() }));
jest.mock("../../../data/useLoans", () => ({ default: jest.fn() }));
jest.mock("../../../data/useActivitiesData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useCheckins", () => ({ useCheckins: jest.fn() }));
jest.mock("../../../data/useGuestByRoom", () => ({ default: jest.fn() }));
jest.mock("../../../data/useActivitiesByCodeData", () => ({ default: jest.fn() }));

/* ------------------------------------------------------------------ */
/*  Import mocked modules *after* registration so we can access       */
/*  the jest.fn instances. `vi.mocked` gives correctly‑typed handles.   */
/* ------------------------------------------------------------------ */
import type { Loans } from "../../../../types/hooks/data/loansData";
import useActivitiesByCodeData from "../../../data/useActivitiesByCodeData";
import useActivitiesData from "../../../data/useActivitiesData";
import useBookingsData from "../../../data/useBookingsData";
import { useCheckins as useCheckinsHook } from "../../../data/useCheckins";
import useCityTax from "../../../data/useCityTax";
import useFinancialsRoom from "../../../data/useFinancialsRoom";
import useGuestByRoom from "../../../data/useGuestByRoom";
import useGuestDetails from "../../../data/useGuestDetails";
import useLoans from "../../../data/useLoans";

/* Typed references to the mocked functions */
const useBookingsMock = jest.mocked(useBookingsData);
const useGuestDetailsMock = jest.mocked(useGuestDetails);
const useFinancialsRoomMock = jest.mocked(useFinancialsRoom);
const useCityTaxMock = jest.mocked(useCityTax);
const useLoansMock = jest.mocked(useLoans);
const useActivitiesMock = jest.mocked(useActivitiesData);
const useCheckinsMock = jest.mocked(useCheckinsHook);
const useGuestByRoomMock = jest.mocked(useGuestByRoom);
const useActivitiesByCodeMock = jest.mocked(useActivitiesByCodeData);

/* ------------------------------------------------------------------ */
/*  Import the hook under test *after* mocks are in place             */
/* ------------------------------------------------------------------ */
import useCheckinsData from "../useCheckinsData";

/* ------------------------------------------------------------------ */
/*  Shared mock data                                                  */
/* ------------------------------------------------------------------ */
const loans: Loans = {
  BR1: {
    occ1: {
      txns: {
        l1: {
          item: "Hairdryer",
          deposit: 10,
          count: 1,
          type: "Loan",
          createdAt: "2024-06-01T10:00:00Z",
          depositType: "CASH",
        },
      },
    },
  },
};
const baseData = {
  bookings: {
    BR1: {
      occ1: {
        checkInDate: "2024-06-01",
        checkOutDate: "2024-06-05",
        roomNumbers: ["101"],
      },
      occ2: {
        checkInDate: "2024-05-01",
        checkOutDate: "2024-05-03",
        roomNumbers: ["102"],
      },
    },
  },
  guestsDetails: {
    BR1: {
      occ1: {
        firstName: "Alice",
        lastName: "Smith",
        citizenship: "US",
        placeOfBirth: "NY",
        municipality: "NYC",
        gender: "F",
        document: { number: "123" },
        dateOfBirth: { dd: "01", mm: "02", yyyy: "1990" },
      },
    },
  },
  financialsRoom: {
    BR1: {
      balance: 100,
      totalDue: 150,
      totalPaid: 50,
      totalAdjust: 0,
      transactions: {},
    },
  },
  cityTax: {
    BR1: {
      occ1: { balance: 10, totalDue: 10, totalPaid: 0 },
    },
  },
  loans,
  activities: {
    occ1: { a1: { code: 1, who: "sys" } },
  },
  checkins: {
    "2024-06-01": { occ1: { timestamp: "2024-06-01T09:00:00Z" } },
  },
  guestByRoom: {
    occ1: { allocated: "101", booked: "101" },
  },
  activitiesByCodes: {
    21: {
      occ1: {
        c1: { who: "sys", timestamp: "2024-06-01T08:00:00Z", description: "" },
      },
    },
  },
};

/** Seed mocks with base data */
function setBaseReturns() {
  useBookingsMock.mockReturnValue({
    bookings: baseData.bookings,
    loading: false,
    error: null,
  });
  useGuestDetailsMock.mockReturnValue({
    guestsDetails: baseData.guestsDetails,
    loading: false,
    error: null,
    validationError: null,
  });
  useFinancialsRoomMock.mockReturnValue({
    financialsRoom: baseData.financialsRoom,
    loading: false,
    error: null,
  });
  useCityTaxMock.mockReturnValue({
    cityTax: baseData.cityTax,
    loading: false,
    error: null,
  });
  useLoansMock.mockReturnValue({
    loans: baseData.loans,
    loading: false,
    error: null,
  });
  useActivitiesMock.mockReturnValue({
    activities: baseData.activities,
    loading: false,
    error: null,
  });
  useCheckinsMock.mockReturnValue({
    checkins: baseData.checkins,
    loading: false,
    error: null,
  });
  useGuestByRoomMock.mockReturnValue({
    guestByRoom: baseData.guestByRoom,
    loading: false,
    error: null,
  });
  useActivitiesByCodeMock.mockReturnValue({
    activitiesByCodes: baseData.activitiesByCodes,
    loading: false,
    error: null,
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe("useCheckinsData", () => {
  beforeEach(() => {
    setBaseReturns();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("merges data across hooks", async () => {
    const { result } = renderHook(() =>
      useCheckinsData({ startDate: "2024-06-01", endDate: "2024-06-30" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.length).toBe(1);
    const row = result.current.data[0];

    expect(row.bookingRef).toBe("BR1");
    expect(row.occupantId).toBe("occ1");
    expect(row.firstName).toBe("Alice");
    expect(row.roomAllocated).toBe("101");

    // Ensure `loans` is defined, then assert item
    expect(row.loans).toBeDefined();
    expect(row.loans?.occ1?.txns?.l1?.item).toBe("Hairdryer");

    expect(row.activities).toEqual([
      { code: 1, who: "sys" },
      { code: 21, who: "sys" },
    ]);
    expect(row.isFirstForBooking).toBe(true);
    expect(result.current.validationError).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("reflects loading state", () => {
    useBookingsMock.mockReturnValueOnce({
      bookings: {},
      loading: true,
      error: null,
    });

    const { result } = renderHook(() =>
      useCheckinsData({ startDate: "2024-06-01", endDate: "2024-06-30" })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it("propagates errors", () => {
    const err = new Error("fail");
    useCityTaxMock.mockReturnValueOnce({
      cityTax: {},
      loading: false,
      error: err,
    });

    const { result } = renderHook(() =>
      useCheckinsData({ startDate: "2024-06-01", endDate: "2024-06-30" })
    );

    expect(result.current.error).toBe(err);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it("returns validation errors separately", () => {
    useGuestDetailsMock.mockReturnValueOnce({
      guestsDetails: {},
      loading: false,
      error: null,
      validationError: new Error("bad dob"),
    });

    const { result } = renderHook(() =>
      useCheckinsData({ startDate: "2024-06-01", endDate: "2024-06-30" })
    );

    expect(result.current.error).toBeNull();
    expect(result.current.validationError).toBeInstanceOf(Error);
    expect(result.current.data.length).toBe(1);
  });
});
