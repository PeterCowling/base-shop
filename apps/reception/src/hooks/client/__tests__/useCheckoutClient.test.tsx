import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { type Loans } from "../../../types/hooks/data/loansData";
import useCheckoutClient from "../useCheckoutClient";

// ---- Mock data ---------------------------------------------------------------
const bookings = {
  BR1: {
    occ1: { checkOutDate: "2024-06-02", roomNumbers: [101] },
  },
};

const guestsDetails = {
  BR1: {
    occ1: { firstName: "Alice", lastName: "Smith", gender: "F" },
  },
};

const financialsRoom = {
  BR1: {
    balance: 0,
    totalDue: 0,
    totalPaid: 0,
    totalAdjust: 0,
    transactions: {},
  },
};

const loans: Loans = {
  BR1: {
    occ1: {
      txns: {
        l1: {
          count: 1,
          createdAt: "2024-06-01T00:00:00Z",
          depositType: "CASH",
          deposit: 0,
          item: "Umbrella",
          type: "Loan",
        },
      },
    },
  },
};

const activities = {
  occ1: {
    a1: { code: 1, who: "sys" },
  },
};

const activitiesByCodes = {
  "14": {
    occ1: {
      a2: { who: "sys" },
    },
  },
};

const checkouts = {
  "2024-06-02": {
    occ1: { timestamp: "2024-06-02T10:00:00Z" },
  },
};

const guestByRoom = {
  occ1: { allocated: "101", booked: "101" },
};

// ---- Tests ------------------------------------------------------------------
describe("useCheckoutClient", () => {
  it("produces a checkout row with merged data", () => {
    const { result } = renderHook(() =>
      useCheckoutClient({
        bookings,
        guestsDetails,
        financialsRoom,
        loans,
        activities,
        activitiesByCodes,
        checkouts,
        guestByRoom,
        loading: false,
        error: null,
      })
    );

    expect(result.current.length).toBe(1);
    const row = result.current[0];

    expect(row.bookingRef).toBe("BR1");
    expect(row.occupantId).toBe("occ1");
    expect(row.checkOutTimestamp).toBe(Date.parse("2024-06-02T10:00:00Z"));
    expect(row.firstName).toBe("Alice");
    expect(row.lastName).toBe("Smith");
    expect(row.rooms).toEqual(["101"]);
    expect(row.financials).toEqual(financialsRoom.BR1);
    expect(row.loans).toEqual({
      l1: {
        count: 1,
        createdAt: "",
        depositType: "CASH",
        deposit: 0,
        item: "Umbrella",
        type: "Loan",
      },
    });
    expect(row.activities.length).toBe(2);
    expect(row.isCompleted).toBe(true);
  });

  it("filters rows by startDate", () => {
    const { result } = renderHook(() =>
      useCheckoutClient({
        bookings,
        guestsDetails,
        financialsRoom,
        loans,
        activities,
        activitiesByCodes,
        checkouts,
        guestByRoom,
        startDate: "2024-06-03",
        loading: false,
        error: null,
      })
    );

    expect(result.current.length).toBe(0);
  });

  it("filters rows by endDate", () => {
    const { result } = renderHook(() =>
      useCheckoutClient({
        bookings,
        guestsDetails,
        financialsRoom,
        loans,
        activities,
        activitiesByCodes,
        checkouts,
        guestByRoom,
        endDate: "2024-06-01",
        loading: false,
        error: null,
      })
    );

    expect(result.current.length).toBe(0);
  });

  it("marks a guest complete when only a checkout record exists", () => {
    const { result } = renderHook(() =>
      useCheckoutClient({
        bookings,
        guestsDetails,
        financialsRoom,
        loans,
        activities: {},
        activitiesByCodes: { "14": {} },
        checkouts: {
          "2024-06-02": {
            occ1: { timestamp: "2024-06-02T10:00:00Z" },
          },
        },
        guestByRoom,
        loading: false,
        error: null,
      })
    );

    expect(result.current[0]?.isCompleted).toBe(true);
  });
});
