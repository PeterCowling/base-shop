import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import BookingModal from "../BookingModal";
import type { CheckInRow } from "../../../../types/component/CheckinRow";

const updateBookingDates = jest.fn();
jest.mock("../../../../hooks/mutations/useChangeBookingDatesMutator", () => ({
  __esModule: true,
  useBookingDatesMutator: () => ({ updateBookingDates, isLoading: false }),
}));

describe("BookingModal", () => {
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

  it("opens and closes via cancel", async () => {
    function Wrapper() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          {open && (
            <BookingModal booking={booking} onClose={() => setOpen(false)} />
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
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("heading", { name: /booking details/i })
    ).not.toBeInTheDocument();
  });

  it("submits changes and closes", async () => {
    const onClose = jest.fn();
    render(<BookingModal booking={booking} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(updateBookingDates).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

