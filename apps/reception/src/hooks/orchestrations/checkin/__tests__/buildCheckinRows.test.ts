import "@testing-library/jest-dom";
import { buildCheckinRows, parseOccupantLoanData } from "../buildCheckinRows";
import type { Loans } from "../../../../types/hooks/data/loansData";
import type { CityTaxRecord } from "../../../../types/hooks/data/cityTaxData";

/** Tests for parseOccupantLoanData */
describe("parseOccupantLoanData", () => {
  it("handles undefined input", () => {
    expect(parseOccupantLoanData(undefined)).toEqual({ txns: {} });
  });

  it("parses transactions with defaults", () => {
    const raw = {
      txns: {
        t1: {
          item: "Hairdryer",
          deposit: 10,
          count: 2,
          type: "Loan",
          createdAt: "2024-06-01T10:00:00Z",
          method: "CASH",
        },
        t2: {
          item: "Unknown",
          deposit: "bad",
          count: undefined,
          type: "Refund",
          createdAt: "",
          method: "foo",
        } as unknown,
      },
    };

    const parsed = parseOccupantLoanData(raw);
    expect(parsed.txns.t1).toEqual({
      item: "Hairdryer",
      deposit: 10,
      count: 2,
      type: "Loan",
      createdAt: "2024-06-01T10:00:00Z",
      depositType: "CASH",
    });
    expect(parsed.txns.t2.item).toBe("No_card");
    expect(parsed.txns.t2.count).toBe(1);
    expect(parsed.txns.t2.deposit).toBe(0);
    expect(parsed.txns.t2.type).toBe("Refund");
    expect(parsed.txns.t2.depositType).toBe("NO_CARD");
    expect(typeof parsed.txns.t2.createdAt).toBe("string");
  });
});

/** Tests for buildCheckinRows */
describe("buildCheckinRows", () => {
  const baseLoans: Loans = {
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
    activities: {
      occ1: { a1: { code: 1, who: "sys" } },
    },
    checkins: {
      "2024-06-01": { occ1: { timestamp: "2024-06-01T09:00:00Z" } },
    },
    guestByRoom: {
      occ1: { allocated: "101", booked: "101" },
    },
    codeActivitiesMap: {
      occ1: [{ code: 21, who: "sys" }],
    },
  };

  it("builds rows within range", () => {
    const { rows, error } = buildCheckinRows({
      bookings: baseData.bookings,
      guestsDetails: baseData.guestsDetails,
      financialsRoom: baseData.financialsRoom,
      cityTax: baseData.cityTax,
      loans: baseLoans,
      activities: baseData.activities,
      codeActivitiesMap: baseData.codeActivitiesMap,
      guestByRoom: baseData.guestByRoom,
      checkins: baseData.checkins,
      startDate: "2024-06-01",
      endDate: "2024-06-30",
    });

    expect(error).toBeNull();
    expect(rows.length).toBe(1);
    const row = rows[0];
    expect(row.bookingRef).toBe("BR1");
    expect(row.occupantId).toBe("occ1");
    expect(row.loans?.occ1?.txns?.l1?.item).toBe("Hairdryer");
    expect(row.isFirstForBooking).toBe(true);
  });

  it("skips occupants outside range", () => {
    const { rows } = buildCheckinRows({
      bookings: baseData.bookings,
      startDate: "2024-06-01",
      endDate: "2024-06-30",
    });
    // occ2 falls outside the date range so only occ1 should be returned
    expect(rows.length).toBe(1);
    expect(rows[0].occupantId).toBe("occ1");
  });

  it("returns validation error for bad data", () => {
    const badCityTax = {
      BR1: { occ1: { balance: "bad" } as unknown as CityTaxRecord },
    };
    const { rows, error } = buildCheckinRows({
      bookings: baseData.bookings,
      guestsDetails: baseData.guestsDetails,
      financialsRoom: baseData.financialsRoom,
      cityTax: badCityTax,
      loans: baseLoans,
      activities: baseData.activities,
      guestByRoom: baseData.guestByRoom,
      checkins: baseData.checkins,
      startDate: "2024-06-01",
      endDate: "2024-06-30",
    });

    expect(rows.length).toBe(0);
    expect(error).not.toBeNull();
  });
});
