import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

import type { PrepaymentData } from "../../../hooks/client/checkin/usePrepaymentData";
import DeleteBookingModal from "../DeleteBookingModal";

// Mock the deletion hook to avoid AuthContext dependency
jest.mock("../../../hooks/mutations/useDeleteBooking", () => ({
  __esModule: true,
  default: () => ({ deleteBooking: jest.fn(), loading: false, error: null }),
}));

const booking: PrepaymentData = {
  bookingRef: "ABC",
  occupantId: "1",
  occupantName: "Bob",
  ccCardNumber: "1111",
  ccExpiry: "12/25",
  codes: [],
  hoursElapsed21: null,
  hoursElapsed5: null,
  hoursElapsed6: null,
  amountToCharge: 0,
  checkInDate: "2025-01-01",
};

it("applies dark mode classes", () => {
  const { container } = render(
    <DeleteBookingModal booking={booking} onClose={() => undefined} />
  );
  const modal = container.querySelector("div > div.bg-white");
  expect(modal).toHaveClass("dark-surface");
  expect(modal).toHaveClass("dark:text-darkAccentGreen");
});

