// src/components/checkins/__tests__/BookingRow.test.tsx
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CheckInRow } from "../../../types/component/CheckinRow";
/* ------------------------------------------------------------------ */
/*  Component under test (imported after mocks)                        */
/* ------------------------------------------------------------------ */
import BookingRow from "../BookingRow";

/* ------------------------------------------------------------------ */
/*  Hoist‑safe mock placeholders                                       */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var bookingNotesMock: jest.Mock;
var allocateRoomIfAllowedMock: jest.Mock;
var occupantLoansMock: jest.Mock;
var confirmMock: jest.Mock;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                       */
/* ------------------------------------------------------------------ */
jest.mock("../../../hooks/data/useBookingNotes", () => {
  bookingNotesMock = jest.fn();
  return { default: (ref: string) => bookingNotesMock(ref) };
});

jest.mock("../../../hooks/mutations/useAllocateRoom", () => {
  allocateRoomIfAllowedMock = jest.fn();
  return {
    default: () => ({ allocateRoomIfAllowed: allocateRoomIfAllowedMock }),
  };
});

jest.mock("../../loans/useOccupantLoans", () => {
  occupantLoansMock = jest.fn();
  return {
    default: (bookingRef: string, occupantId: string) =>
      occupantLoansMock(bookingRef, occupantId),
  };
});

jest.mock("../../../utils/confirmAndAllocateRoom", () => {
  confirmMock = jest.fn();
  return { confirmAndAllocateRoom: (opts: unknown) => confirmMock(opts) };
});

/* Dumb component mocks - not part of the TDZ fix */
jest.mock("../cityTaxButton/CityTaxPaymentButton", () => ({
  default: () => <div data-testid="city-tax-button" />,
}));
jest.mock("../DocInsertButton", () => ({
  default: () => <div data-testid="doc-insert" />,
}));
jest.mock("../EmailBookingButton", () => ({
  default: () => <div data-testid="email-booking" />,
}));
jest.mock("../keycardButton/KeycardDepositButton", () => ({
  default: () => <div data-testid="keycard-button" />,
}));
jest.mock("../roomButton/roomPaymentButton", () => ({
  default: () => <div data-testid="room-payment" />,
}));
jest.mock("../StatusButton", () => ({
  default: () => <div data-testid="status-button" />,
}));
jest.mock("../tooltip/Tooltip", () => ({
  default: ({
    booking,
    onDoubleClick,
  }: {
    booking: { personalDetails: { firstName: string; lastName: string } };
    onDoubleClick?: () => void;
  }) => (
    <span onDoubleClick={onDoubleClick} data-testid="tooltip-name">
      {booking.personalDetails.firstName} {booking.personalDetails.lastName}
    </span>
  ),
}));
jest.mock("../notes/BookingNotesModal", () => ({
  default: () => (
    <div
      data-testid="notes-modal"
      className="dark:bg-darkSurface dark:text-darkAccentGreen"
    >
      notes
    </div>
  ),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */
const baseBooking: CheckInRow = {
  bookingRef: "BR1",
  occupantId: "O1",
  checkInDate: "2025-01-01",
  rooms: [],
  firstName: "John",
  lastName: "Doe",
  roomBooked: "101",
  roomAllocated: "101",
  activities: [],
  isFirstForBooking: true,
};

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */
describe("BookingRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    bookingNotesMock.mockReturnValue({
      notes: {},
      loading: false,
      error: null,
    });
    occupantLoansMock.mockReturnValue({
      occupantLoans: null,
      loading: false,
      error: null,
    });
    allocateRoomIfAllowedMock.mockResolvedValue("101");
    confirmMock.mockImplementation(async (opts) => {
      const val = await opts.onConfirm();
      opts.onSuccess?.(val);
    });
  });

  it("renders basic info and keycard icon", async () => {
    occupantLoansMock.mockReturnValue({
      occupantLoans: {
        txns: {
          t1: {
            item: "Keycard",
            type: "Loan",
            count: 1,
            createdAt: "2024-01-01",
            depositType: "CASH",
            deposit: 10,
          },
        },
      },
      loading: false,
      error: null,
    });

    render(
      <table>
        <tbody>
          <BookingRow
            booking={baseBooking}
            selectedDate="2025-01-01"
            allGuests={[baseBooking]}
          />
        </tbody>
      </table>
    );

    expect(screen.getByTestId("tooltip-name")).toHaveTextContent("John Doe");
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("101");
    expect(await screen.findByTitle("Keycard with cash")).toBeInTheDocument();
    expect(screen.getByTestId("city-tax-button")).toBeInTheDocument();
    expect(screen.getByTestId("room-payment")).toBeInTheDocument();
  });

  it("allocates room on enter", async () => {
    allocateRoomIfAllowedMock.mockResolvedValue("105");

    render(
      <table>
        <tbody>
          <BookingRow
            booking={baseBooking}
            selectedDate="2025-01-01"
            allGuests={[baseBooking]}
          />
        </tbody>
      </table>
    );

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "105{enter}");

    expect(confirmMock).toHaveBeenCalled();
    expect(allocateRoomIfAllowedMock).toHaveBeenCalledWith({
      occupantId: "O1",
      newRoomValue: "105",
      oldDate: "2025-01-01",
      oldRoom: "index_101",
      oldBookingRef: "BR1",
      oldGuestId: "O1",
      newDate: "2025-01-01",
      newRoom: "index_105",
      newBookingRef: "BR1",
      newGuestId: "O1",
    });
    expect(input).toHaveValue("105");
  });

  it("fires row click callback", async () => {
    const onRowClick = jest.fn();

    render(
      <table>
        <tbody>
          <BookingRow
            booking={baseBooking}
            selectedDate="2025-01-01"
            allGuests={[baseBooking]}
            onRowClick={onRowClick}
          />
        </tbody>
      </table>
    );

    await userEvent.click(screen.getByRole("row"));
    expect(onRowClick).toHaveBeenCalledWith(baseBooking);
  });

  it("opens notes modal on name double click", async () => {
    render(
      <table>
        <tbody>
          <BookingRow
            booking={baseBooking}
            selectedDate="2025-01-01"
            allGuests={[baseBooking]}
          />
        </tbody>
      </table>
    );

    await userEvent.dblClick(screen.getByTestId("tooltip-name"));
    const modal = screen.getByTestId("notes-modal");
    expect(modal).toBeInTheDocument();
    expect(modal.className).toContain("dark:bg-darkSurface");
    expect(modal.className).toContain("dark:text-darkAccentGreen");
  });
});
