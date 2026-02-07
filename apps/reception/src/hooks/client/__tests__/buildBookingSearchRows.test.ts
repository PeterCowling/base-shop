import "@testing-library/jest-dom";

import { ActivityCode } from "../../../constants/activities";
import { buildBookingSearchRows } from "../bookingSearchUtils";

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

describe("buildBookingSearchRows", () => {
  it("assembles and filters rows", () => {
    const rows = buildBookingSearchRows({
      bookings,
      guestsDetails,
      financialsRoom,
      activities,
      checkins,
      checkouts,
      guestByRoom,
      filters: { firstName: "alice" },
    });

    expect(rows.length).toBe(1);
    expect(rows[0].occupantId).toBe("occ1");
    expect(rows[0].nonRefundable).toBe(true);
  });

  it("filters by status", () => {
    const rows = buildBookingSearchRows({
      bookings,
      guestsDetails,
      financialsRoom,
      activities,
      checkins,
      checkouts,
      guestByRoom,
      filters: { status: "5" },
    });

    expect(rows.length).toBe(1);
    expect(rows[0].occupantId).toBe("occ2");
  });
});
