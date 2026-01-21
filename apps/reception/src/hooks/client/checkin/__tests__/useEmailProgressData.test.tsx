// File: src/hooks/client/checkin/__tests__/useEmailProgressData.test.tsx
import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/*  Register data‑hook mocks first – hoist‑safe for Vitest            */
/* ------------------------------------------------------------------ */
jest.mock("../../../data/useActivitiesData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useActivitiesByCodeData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useBookingsData", () => ({ default: jest.fn() }));
jest.mock("../../../data/useFinancialsRoom", () => ({ default: jest.fn() }));
jest.mock("../../../data/useGuestDetails", () => ({ default: jest.fn() }));

/* ------------------------------------------------------------------ */
/*  Import mocked modules to access the jest.fn instances                */
/* ------------------------------------------------------------------ */
import useActivitiesByCodeData from "../../../data/useActivitiesByCodeData";
import useActivitiesData from "../../../data/useActivitiesData";
import useBookingsData from "../../../data/useBookingsData";
import useFinancialsRoom from "../../../data/useFinancialsRoom";
import useGuestDetails from "../../../data/useGuestDetails";

const useActivitiesDataMock = jest.mocked(useActivitiesData);
const useActivitiesByCodeDataMock = jest.mocked(useActivitiesByCodeData);
const useBookingsMock = jest.mocked(useBookingsData);
const useFinancialsRoomMock = jest.mocked(useFinancialsRoom);
const useGuestDetailsMock = jest.mocked(useGuestDetails);

/* ------------------------------------------------------------------ */
/*  Import constants and the hook under test                           */
/* ------------------------------------------------------------------ */
import { EMAIL_CODES } from "../../../../constants/emailCodes";
import useEmailProgressData from "../useEmailProgressData";

/* ------------------------------------------------------------------ */
/*  Test fixtures                                                     */
/* ------------------------------------------------------------------ */
const bookings = {
  BR1: {
    occ1: { leadGuest: true },
    occ2: { leadGuest: true },
    occ3: { leadGuest: false },
  },
  BR2: {
    occ4: { leadGuest: true },
  },
};

const guestsDetails = {
  BR1: {
    occ1: { firstName: "Alice", lastName: "Smith", email: "alice@example.com" },
    occ2: { firstName: "Bob", lastName: "Jones", email: "bob@example.com" },
  },
  BR2: {
    occ4: { firstName: "Carol", lastName: "Doe", email: "carol@example.com" },
  },
};

const financialsRoom = {
  BR1: {
    balance: 0,
    totalDue: 0,
    totalPaid: 0,
    totalAdjust: 0,
    transactions: {
      t1: { amount: 100, nonRefundable: true, timestamp: "", type: "charge" },
    },
  },
  BR2: {
    balance: 0,
    totalDue: 0,
    totalPaid: 0,
    totalAdjust: 0,
    transactions: {
      t2: { amount: 50, nonRefundable: false, timestamp: "", type: "charge" },
    },
  },
};

const rawActivities = {
  occ1: {
    a1: { code: 1, timestamp: "2024-06-01T08:00:00Z", who: "sys" },
    a2: { code: 15, timestamp: "2024-06-02T06:00:00Z", who: "sys" },
  },
  occ2: {
    a1: { code: 4, timestamp: "2024-06-02T08:00:00Z", who: "sys" },
  },
  occ3: {
    a1: { code: 1, timestamp: "2024-06-01T08:00:00Z", who: "sys" },
  },
};

const activitiesByCodes = {
  "24": {
    occ2: {
      c1: { who: "sys", timestamp: "2024-06-04T08:00:00Z", description: "" },
    },
  },
  "17": {
    occ4: {
      c1: { who: "sys", timestamp: "2024-06-05T08:00:00Z", description: "" },
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Test setup helpers                                                */
/* ------------------------------------------------------------------ */
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2024-06-05T06:00:00Z"));

  useActivitiesDataMock.mockReturnValue({
    activities: rawActivities,
    loading: false,
    error: null,
  });
  useActivitiesByCodeDataMock.mockReturnValue({
    activitiesByCodes,
    loading: false,
    error: null,
  });
  useBookingsMock.mockReturnValue({
    bookings,
    loading: false,
    error: null,
  });
  useFinancialsRoomMock.mockReturnValue({
    financialsRoom,
    loading: false,
    error: null,
  });
  useGuestDetailsMock.mockReturnValue({
    guestsDetails,
    loading: false,
    error: null,
    validationError: null,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Test suite                                                        */
/* ------------------------------------------------------------------ */
describe("useEmailProgressData", () => {
  it("filters occupants according to rules", () => {
    const { result } = renderHook(() => useEmailProgressData());

    expect(result.current.emailData).toHaveLength(1);

    const item = result.current.emailData[0];
    expect(item.occupantId).toBe("occ1");
    expect(item.bookingRef).toBe("BR1");
    expect(item.occupantName).toBe("Alice Smith");
    expect(item.occupantEmail).toBe("alice@example.com");

    const expectedCode = Math.max(...[1, 15].filter((c) => EMAIL_CODES.has(c)));
    expect(item.currentCode).toBe(expectedCode);
    expect(item.hoursElapsed).toBeCloseTo(72);
  });

  it("aggregates loading flags", () => {
    useBookingsMock.mockReturnValueOnce({
      bookings,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() => useEmailProgressData());
    expect(result.current.loading).toBe(true);
  });

  it("aggregates error flags", () => {
    const err = new Error("boom");
    useGuestDetailsMock.mockReturnValueOnce({
      guestsDetails,
      loading: false,
      error: err,
      validationError: null,
    });

    const { result } = renderHook(() => useEmailProgressData());
    expect(result.current.error).toBe(err);
  });
});
