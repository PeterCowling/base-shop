import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

// Mock deletion hook
const deleteBookingMock = vi.fn();
vi.mock("../../../hooks/mutations/useDeleteBooking", () => ({
  __esModule: true,
  default: () => ({ deleteBooking: deleteBookingMock, loading: false, error: null }),
}));

import DeleteBookingModal from "../DeleteBookingModal";
import type { PrepaymentData } from "../../../hooks/client/checkin/usePrepaymentData";

const booking: PrepaymentData = {
  bookingRef: "ABC",
  occupantId: "1",
  occupantName: "Alice",
  ccCardNumber: "1234",
  ccExpiry: "12/25",
  codes: [],
  hoursElapsed21: null,
  hoursElapsed5: null,
  hoursElapsed6: null,
  amountToCharge: 0,
  checkInDate: "2025-01-01",
};

describe("BillingDialogue", () => {
  beforeEach(() => {
    deleteBookingMock.mockResolvedValue(undefined);
  });

  it("triggers onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<DeleteBookingModal booking={booking} onClose={onClose} />);
    fireEvent.click(screen.getByText(/cancel/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls delete and closes on confirmation", async () => {
    const onClose = vi.fn();
    render(<DeleteBookingModal booking={booking} onClose={onClose} />);
    fireEvent.click(
      screen.getByRole("button", { name: /^delete$/i })
    );
    await waitFor(() =>
      expect(deleteBookingMock).toHaveBeenCalledWith("ABC")
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

