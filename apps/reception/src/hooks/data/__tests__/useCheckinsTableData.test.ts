// File: src/hooks/data/__tests__/useCheckinsTableData.test.ts
import "@testing-library/jest-dom";

import { renderHook, waitFor } from "@testing-library/react";

import type { Loans } from "../../../types/hooks/data/loansData";
import useActivitiesByCodeData from "../useActivitiesByCodeData";
import useActivitiesData from "../useActivitiesData";
import useBookingsData from "../useBookingsData";
import { useCheckins as useCheckinsHook } from "../useCheckins";
import useCheckinsTableData from "../useCheckinsTableData";
import useCityTax from "../useCityTax";
import useFinancialsRoom from "../useFinancialsRoom";
import useGuestByRoom from "../useGuestByRoom";
import useGuestDetails from "../useGuestDetails";
import useLoans from "../useLoans";

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
jest.mock("../useBookingsData", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useGuestDetails", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useFinancialsRoom", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useCityTax", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useLoans", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useActivitiesData", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useCheckins", () => ({ useCheckins: jest.fn() }));
jest.mock("../useGuestByRoom", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../useActivitiesByCodeData", () => ({ __esModule: true, default: jest.fn() }));

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
  // useCheckins is called with a dateQuery { startAt, endAt } arg in useCheckinsTableData
  checkins: {
    "2024-06-01": { occ1: { timestamp: "2024-06-01T09:00:00Z" } },
  },
  guestByRoom: {
    occ1: { allocated: "101", booked: "101" },
  },
  activitiesByCodes: {
    "21": {
      occ1: {
        c1: { who: "sys", timestamp: "2024-06-01T08:00:00Z" },
      },
    },
  },
};

/** Seed all mocks with base data */
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
  // useCheckins is called with a dateQuery arg — mock accepts any args
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
describe("useCheckinsTableData", () => {
  beforeEach(() => {
    setBaseReturns();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TC-01: Happy path — all child hooks return data, rows is non-empty
  it("merges data across hooks and returns rows", async () => {
    const { result } = renderHook(() =>
      useCheckinsTableData({
        selectedDate: "2024-06-01",
        daysBefore: 1,
        daysAfter: 5,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows.length).toBe(1);
    const row = result.current.rows[0];
    expect(row.bookingRef).toBe("BR1");
    expect(row.occupantId).toBe("occ1");
    expect(row.firstName).toBe("Alice");
    expect(row.roomAllocated).toBe("101");
    expect(row.isFirstForBooking).toBe(true);
    expect(result.current.validationError).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // TC-02: Loading state — one child hook loading causes overall loading to be true
  it("reflects loading state when a child hook is loading", () => {
    useBookingsMock.mockReturnValueOnce({
      bookings: {},
      loading: true,
      error: null,
    });

    const { result } = renderHook(() =>
      useCheckinsTableData({
        selectedDate: "2024-06-01",
        daysBefore: 1,
        daysAfter: 5,
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.rows).toEqual([]);
  });

  // TC-03: Error propagation — one child hook error causes overall error to be set
  it("propagates errors from child hooks", () => {
    const err = new Error("Firebase read failed");
    useCityTaxMock.mockReturnValueOnce({
      cityTax: {},
      loading: false,
      error: err,
    });

    const { result } = renderHook(() =>
      useCheckinsTableData({
        selectedDate: "2024-06-01",
        daysBefore: 1,
        daysAfter: 5,
      })
    );

    expect(result.current.error).toBe(err);
    expect(result.current.loading).toBe(false);
    expect(result.current.rows).toEqual([]);
  });

  // TC-04: Validation error — guestDetails returns validationError, rows still returned
  it("returns validation errors separately without blocking rows", async () => {
    useGuestDetailsMock.mockReturnValueOnce({
      guestsDetails: baseData.guestsDetails,
      loading: false,
      error: null,
      validationError: new Error("bad dob"),
    });

    const { result } = renderHook(() =>
      useCheckinsTableData({
        selectedDate: "2024-06-01",
        daysBefore: 1,
        daysAfter: 5,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.validationError).toBeInstanceOf(Error);
    // Row is still returned since guestsDetails data is present
    expect(result.current.rows.length).toBe(1);
  });

  // TC-05: No bookings — rows is empty, no error thrown
  it("returns empty rows when bookings is null/undefined", async () => {
    useBookingsMock.mockReturnValueOnce({
      bookings: null,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useCheckinsTableData({
        selectedDate: "2024-06-01",
        daysBefore: 1,
        daysAfter: 5,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
