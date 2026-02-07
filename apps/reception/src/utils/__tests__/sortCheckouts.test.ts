
import "@testing-library/jest-dom";

import type { Guest } from "../../components/checkout/CheckoutTable";
import { sortCheckoutsData } from "../sortCheckouts";

// Helper to create a guest with default fields
const createGuest = (overrides: Partial<Guest>): Guest => ({
  bookingRef: "",
  guestId: "",
  checkoutDate: "2024-01-01",
  firstName: "Test",
  lastName: "User",
  roomAllocated: "0",
  isCompleted: false,
  ...overrides,
});

describe("sortCheckoutsData", () => {
  it("orders guests by booking completeness and room numbers", () => {
    const guests: Guest[] = [
      createGuest({
        bookingRef: "brA",
        guestId: "a1",
        firstName: "Alice",
        roomAllocated: "104",
        isCompleted: false,
      }),
      createGuest({
        bookingRef: "brB",
        guestId: "b1",
        firstName: "Bob",
        roomAllocated: "201",
        isCompleted: true,
      }),
      createGuest({
        bookingRef: "brC",
        guestId: "c1",
        firstName: "Charlie",
        roomAllocated: "A1",
        isCompleted: true,
      }),
      createGuest({
        bookingRef: "brA",
        guestId: "a2",
        firstName: "Aaron",
        roomAllocated: "102",
        isCompleted: true,
      }),
      createGuest({
        bookingRef: "brD",
        guestId: "d1",
        firstName: "Dana",
        roomAllocated: "101",
        isCompleted: false,
      }),
      createGuest({
        bookingRef: "brD",
        guestId: "d2",
        firstName: "David",
        roomAllocated: "103",
        isCompleted: false,
      }),
      createGuest({
        bookingRef: "brB",
        guestId: "b2",
        firstName: "Betty",
        roomAllocated: "202",
        isCompleted: true,
      }),
    ];

    const sorted = sortCheckoutsData(guests);
    const sortedIds = sorted.map((g) => g.guestId);

    expect(sortedIds).toEqual(["d1", "d2", "a2", "a1", "b1", "b2", "c1"]);
  });
});
