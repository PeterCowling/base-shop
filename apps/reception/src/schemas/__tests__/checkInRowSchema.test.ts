import { describe, expect, it } from "vitest";

import { checkInRowSchema } from "../checkInRowSchema";

const fullRow = {
  bookingRef: "BR1",
  occupantId: "O1",
  firstName: "Alice",
  lastName: "Smith",
  roomBooked: "101",
  roomAllocated: "102",
  financials: {},
  loans: {
    O1: {
      txns: {
        t1: {
          count: 1,
          createdAt: "2024-01-01",
          depositType: "CASH",
          deposit: 10,
          item: "Umbrella",
          type: "Loan",
        },
      },
    },
  },
  activity: {
    a1: { code: 1, who: "tester", timestamp: "2024-01-01" },
  },
  isFirstForBooking: true,
  mealPlans: { level: "basic", type: "adult" },
  notes: "note",
  occupantDetails: {
    firstName: "Alice",
    lastName: "Smith",
    dateOfBirth: { yyyy: "1990", mm: "05", dd: "01" },
  },
  cityTax: { balance: 0, totalDue: 5, totalPaid: 0 },
  checkInDate: "2024-01-01",
  checkOutDate: "2024-01-02",
  rooms: ["101", "102"],
  actualCheckInTimestamp: "2024-01-01T12:00:00Z",
  activities: [{ code: 2, who: "tester", timestamp: "2024-01-02" }],
  citizenship: "USA",
  placeOfBirth: "NY",
  dateOfBirth: { yyyy: "1990", mm: "05", dd: "01" },
  municipality: "NYC",
  gender: "F",
  docNumber: "ABC123",
};

describe("checkInRowSchema", () => {
  it("parses a comprehensive row and sets defaults", () => {
    const parsed = checkInRowSchema.parse(fullRow);
    expect(parsed.financials).toEqual({
      balance: 0,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {},
    });
  });

  it("rejects invalid nested occupant data", () => {
    expect(() =>
      checkInRowSchema.parse({
        bookingRef: "BR1",
        occupantId: "O1",
        checkInDate: "2024-01-01",
        rooms: ["101"],
        occupantDetails: {
          dateOfBirth: { yyyy: "1990", mm: "13", dd: "01" },
        },
      })
    ).toThrow();
  });
});
