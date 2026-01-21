import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var allocateRoomMock: jest.Mock;
var bookingsMock: jest.Mock;
var guestByRoomMock: jest.Mock;
var roomConfigsMock: jest.Mock;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
jest.mock("../../../hooks/mutations/useAllocateRoom", () => {
  allocateRoomMock = jest.fn();
  return {
    default: () => ({ allocateRoomIfAllowed: allocateRoomMock }),
  };
});

jest.mock("../../../hooks/data/useBookingsData", () => {
  bookingsMock = jest.fn();
  return { default: () => bookingsMock() };
});

jest.mock("../../../hooks/data/roomgrid/useGuestByRoomData", () => {
  guestByRoomMock = jest.fn();
  return { default: () => guestByRoomMock() };
});

jest.mock("../../../hooks/client/checkin/useRoomConfigs", () => {
  roomConfigsMock = jest.fn();
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
    jest.clearAllMocks();
    setAllMocks();
  });

  it("closes when close button clicked", async () => {
    const onClose = jest.fn();
    render(<BookingDetailsModal bookingDetails={bookingDetails} onClose={onClose} />);

    await userEvent.click(screen.getByLabelText(/close/i));

    expect(onClose).toHaveBeenCalled();
  });

  it("moves booking when confirmed", async () => {
    const onClose = jest.fn();
    jest.spyOn(window, "confirm").mockReturnValue(true);

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

