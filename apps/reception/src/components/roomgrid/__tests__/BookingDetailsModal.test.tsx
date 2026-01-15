import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var allocateRoomMock: ReturnType<typeof vi.fn>;
var bookingsMock: ReturnType<typeof vi.fn>;
var guestByRoomMock: ReturnType<typeof vi.fn>;
var roomConfigsMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
vi.mock("../../../hooks/mutations/useAllocateRoom", () => {
  allocateRoomMock = vi.fn();
  return {
    default: () => ({ allocateRoomIfAllowed: allocateRoomMock }),
  };
});

vi.mock("../../../hooks/data/useBookingsData", () => {
  bookingsMock = vi.fn();
  return { default: () => bookingsMock() };
});

vi.mock("../../../hooks/data/roomgrid/useGuestByRoomData", () => {
  guestByRoomMock = vi.fn();
  return { default: () => guestByRoomMock() };
});

vi.mock("../../../hooks/client/checkin/useRoomConfigs", () => {
  roomConfigsMock = vi.fn();
  return { default: () => roomConfigsMock() };
});

/* ------------------------------------------------------------------ */
/*  Component under test (imported after mocks)                        */
/* ------------------------------------------------------------------ */
import BookingDetailsModal from "../BookingDetailsModal";

/* ------------------------------------------------------------------ */
/*  Test data                                                          */
/* ------------------------------------------------------------------ */
const bookingDetails = {
  roomNumber: "101",
  id: "bed-1",
  date: "2025-05-01",
  dayType: "single",
  dayStatus: "12",
  bookingRef: "BR1",
  occupantId: "O1",
  firstName: "Alice",
  lastName: "A",
};

function setAllMocks() {
  roomConfigsMock.mockReturnValue({ knownRooms: ["101", "105"] });
  guestByRoomMock.mockReturnValue({
    guestByRoomData: { O1: { allocated: "101", booked: "101" } },
    loading: false,
    error: null,
  });
  bookingsMock.mockReturnValue({
    bookings: {
      BR1: {
        O1: { roomNumbers: ["101"] },
      },
    },
    loading: false,
    error: null,
  });
  allocateRoomMock.mockResolvedValue("105");
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("BookingDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAllMocks();
  });

  it("closes when close button clicked", async () => {
    const onClose = vi.fn();
    render(<BookingDetailsModal bookingDetails={bookingDetails} onClose={onClose} />);

    await userEvent.click(screen.getByLabelText(/close/i));

    expect(onClose).toHaveBeenCalled();
  });

  it("moves booking when confirmed", async () => {
    const onClose = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<BookingDetailsModal bookingDetails={bookingDetails} onClose={onClose} />);

    await userEvent.selectOptions(screen.getByLabelText(/move booking to room/i), "105");
    await userEvent.click(screen.getByRole("button", { name: /move booking/i }));

    await waitFor(() => {
      expect(allocateRoomMock).toHaveBeenCalledWith({
        occupantId: "O1",
        newRoomValue: "105",
        oldDate: "2025-05-01",
        oldRoom: "index_101",
        oldBookingRef: "BR1",
        oldGuestId: "O1",
        newDate: "2025-05-01",
        newRoom: "index_105",
        newBookingRef: "BR1",
        newGuestId: "O1",
      });
    });

    expect(onClose).toHaveBeenCalled();
  });
});

