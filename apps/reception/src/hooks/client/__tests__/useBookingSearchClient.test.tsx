import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";

import useBookingSearchClient from "../useBookingSearchClient";
import { getMaxActivityCode } from "../bookingSearchUtils";
import { ActivityCode } from "../../../constants/activities";

// ---- Mock data ----
const bookings = {
  BR1: {
    occ1: { checkInDate: "2024-06-01", roomNumbers: [101] },
    occ2: { checkInDate: "2024-06-01", roomNumbers: [102] },
  },
  BR2: {
    occ3: { checkInDate: "2024-06-01", roomNumbers: [103] },
  },
};

const guestsDetails = {
  BR1: {
    occ1: { firstName: "Alice", lastName: "Smith", gender: "F" },
    occ2: { firstName: "Bob", lastName: "Jones", gender: "M" },
  },
  BR2: {
    occ3: { firstName: "Carol", lastName: "Doe", gender: "F" },
  },
};

const financialsRoom = {
  BR1: {
    balance: 0,
    totalDue: 0,
    totalPaid: 0,
    totalAdjust: 0,
    transactions: {
      t1: {
        amount: 100,
        nonRefundable: true,
        timestamp: "",
        type: "charge",
        occupantId: "occ1",
        bookingRef: "BR1",
      },
    },
  },
  BR2: {
    balance: 0,
    totalDue: 0,
    totalPaid: 0,
    totalAdjust: 0,
    transactions: {},
  },
};

const activities = {
  occ1: { a1: { code: ActivityCode.BOOKING_CREATED, who: "sys" } },
  occ2: {
    a1: { code: ActivityCode.AGREED_NONREFUNDABLE_TNC, who: "sys" },
    a2: { code: ActivityCode.FAILED_ROOM_PAYMENT_1, who: "sys" },
  },
  occ3: { a1: { code: ActivityCode.KEYCARD_DEPOSIT_MADE, who: "sys" } },
};

const checkins = {
  "2024-06-01": { occ1: {}, occ2: {}, occ3: {} },
};

const checkouts = {
  "2024-06-02": { occ2: {} },
  "2024-06-03": { occ3: {} },
};

const guestByRoom = {
  occ1: { allocated: "101", booked: "101" },
  occ2: { allocated: "102", booked: "102" },
  occ3: { allocated: "103", booked: "103" },
};

// ---- Hook mocks ----
jest.mock("../../data/useBookingsData", () => ({
  default: () => ({ bookings, loading: false, error: null }),
}));

jest.mock("../../data/useGuestDetails", () => ({
  default: () => ({ guestsDetails, loading: false, error: null }),
}));

jest.mock("../../data/useFinancialsRoom", () => ({
  default: () => ({ financialsRoom, loading: false, error: null }),
}));

jest.mock("../../data/useActivitiesData", () => ({
  default: () => ({ activities, loading: false, error: null }),
}));

jest.mock("../../data/useCheckins", () => ({
  useCheckins: () => ({ checkins, loading: false, error: null }),
}));

jest.mock("../../data/useCheckouts", () => ({
  useCheckouts: () => ({ checkouts, loading: false, error: null }),
}));

jest.mock("../../data/useGuestByRoom", () => ({
  default: () => ({ guestByRoom, loading: false, error: null }),
}));

// ---- Tests ----
describe("useBookingSearchClient", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getMaxActivityCode returns highest priority", () => {
    const acts = [
      { code: ActivityCode.AGREED_NONREFUNDABLE_TNC, who: "" },
      { code: ActivityCode.FAILED_ROOM_PAYMENT_1, who: "" },
      { code: ActivityCode.BOOKING_CREATED, who: "" },
    ];
    expect(getMaxActivityCode(acts)).toBe(ActivityCode.FAILED_ROOM_PAYMENT_1);
  });

  it("filters by first name", async () => {
    const { result } = renderHook(() =>
      useBookingSearchClient({ firstName: "alice" })
    );

    await waitFor(() => expect(result.current.data.length).toBe(1));
    expect(result.current.data[0].occupantId).toBe("occ1");
  });

  it("filters by status using highest priority activity", async () => {
    const { result } = renderHook(() =>
      useBookingSearchClient({ status: "5" })
    );

    await waitFor(() => expect(result.current.data.length).toBe(1));
    expect(result.current.data[0].occupantId).toBe("occ2");
  });

  it("filters by nonRefundable flag", async () => {
    const { result } = renderHook(() =>
      useBookingSearchClient({ nonRefundable: "true" })
    );

    await waitFor(() => expect(result.current.data.length).toBe(1));
    expect(result.current.data[0].occupantId).toBe("occ1");
  });

  it("filters by date across checkouts", async () => {
    const { result } = renderHook(() =>
      useBookingSearchClient({ date: "2024-06-02" })
    );

    await waitFor(() => expect(result.current.data.length).toBe(1));
    expect(result.current.data[0].occupantId).toBe("occ2");
  });

  it("filters by booking reference", async () => {
    const { result } = renderHook(() =>
      useBookingSearchClient({ bookingRef: "BR1" })
    );

    await waitFor(() => expect(result.current.data.length).toBe(2));
    expect(result.current.data.every((r) => r.bookingRef === "BR1")).toBe(true);
  });

  it("filters by room number", async () => {
    const { result } = renderHook(() =>
      useBookingSearchClient({ roomNumber: 103 })
    );

    await waitFor(() => expect(result.current.data.length).toBe(1));
    expect(result.current.data[0].occupantId).toBe("occ3");
  });

  it("does not load data when skipping", async () => {
    const { result } = renderHook(() => useBookingSearchClient({ skip: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.length).toBe(0);
  });
});
