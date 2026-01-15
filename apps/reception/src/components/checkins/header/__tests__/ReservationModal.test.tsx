import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";

import ReservationModal from "../BookingModal";
import type { CheckInRow } from "../../../../types/component/CheckinRow";

const updateBookingDates = vi.fn();
vi.mock("../../../../hooks/mutations/useChangeBookingDatesMutator", () => ({
  __esModule: true,
  useBookingDatesMutator: () => ({ updateBookingDates, isLoading: false }),
}));

describe("ReservationModal", () => {
  const booking: CheckInRow = {
    bookingRef: "BR1",
    occupantId: "occ1",
    firstName: "Jane",
    lastName: "Doe",
    roomBooked: "101",
    roomAllocated: "101",
    checkInDate: "2024-01-01",
    checkOutDate: "2024-01-02",
    rooms: [],
    activities: [],
  };

  beforeEach(() => { updateBookingDates.mockClear(); });

  it("opens, edits fields, and cancels", async () => {
    function Wrapper() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          {open && (
            <ReservationModal booking={booking} onClose={() => setOpen(false)} />
          )}
        </div>
      );
    }
    render(<Wrapper />);
    expect(
      screen.queryByRole("heading", { name: /booking details/i })
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(
      screen.getByRole("heading", { name: /booking details/i })
    ).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/check-in date/i));
    await userEvent.type(screen.getByLabelText(/check-in date/i), "2024-01-03");
    await userEvent.clear(screen.getByLabelText(/check-out date/i));
    await userEvent.type(screen.getByLabelText(/check-out date/i), "2024-01-05");
    await userEvent.type(screen.getByLabelText(/extension charge/i), "100");
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("heading", { name: /booking details/i })
    ).not.toBeInTheDocument();
  });

  it("submits extended booking with valid price", async () => {
    const onClose = vi.fn();
    render(<ReservationModal booking={booking} onClose={onClose} />);
    await userEvent.clear(screen.getByLabelText(/check-in date/i));
    await userEvent.type(screen.getByLabelText(/check-in date/i), "2024-01-02");
    await userEvent.clear(screen.getByLabelText(/check-out date/i));
    await userEvent.type(screen.getByLabelText(/check-out date/i), "2024-01-05");
    await userEvent.type(screen.getByLabelText(/extension charge/i), "25");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(updateBookingDates).toHaveBeenCalledWith({
      bookingRef: booking.bookingRef,
      occupantId: booking.occupantId,
      oldCheckIn: booking.checkInDate,
      oldCheckOut: booking.checkOutDate,
      newCheckIn: "2024-01-02",
      newCheckOut: "2024-01-05",
      extendedPrice: "25",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error when extension price is invalid", async () => {
    const onClose = vi.fn();
    render(<ReservationModal booking={booking} onClose={onClose} />);
    await userEvent.clear(screen.getByLabelText(/check-out date/i));
    await userEvent.type(screen.getByLabelText(/check-out date/i), "2024-01-05");
    await userEvent.clear(screen.getByLabelText(/extension charge/i));
    await userEvent.type(screen.getByLabelText(/extension charge/i), "0");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(
      screen.getByText(/please enter a valid extension charge amount/i)
    ).toBeInTheDocument();
    expect(updateBookingDates).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

