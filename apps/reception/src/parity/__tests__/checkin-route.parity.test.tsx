import "@testing-library/jest-dom";

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CheckinsTableView from "../../components/checkins/view/CheckinsTable";
import type { CheckInRow } from "../../types/component/CheckinRow";

jest.mock("../../components/checkins/DateSelector", () => ({
  __esModule: true,
  default: ({ selectedDate }: { selectedDate: string }) => (
    <div data-cy="checkin-date-selector">{selectedDate}</div>
  ),
}));

jest.mock("../../components/checkins/header/CheckinsHeader", () => ({
  __esModule: true,
  default: ({ onArchiveClick }: { onArchiveClick: () => void }) => (
    <div className="grid grid-cols-3 items-center mb-6">
      <div />
      <h1 className="text-5xl font-heading text-primary-main text-center">CHECKINS</h1>
      <div className="flex justify-end pr-5 space-x-2">
        <button type="button" onClick={onArchiveClick}>
          Archive
        </button>
      </div>
    </div>
  ),
}));

jest.mock("../../components/checkins/BookingRow", () => ({
  __esModule: true,
  default: ({
    booking,
    onRowClick,
  }: {
    booking: CheckInRow;
    onRowClick?: (booking: CheckInRow) => void;
  }) => (
    <tr data-cy={`booking-row-${booking.occupantId}`}>
      <td>{booking.firstName}</td>
      <td>
        <button type="button" onClick={() => onRowClick?.(booking)}>
          row-action
        </button>
      </td>
    </tr>
  ),
}));

jest.mock("../../components/checkins/TableHeader", () => ({
  __esModule: true,
  default: () => (
    <thead>
      <tr>
        <th scope="col">Guest</th>
      </tr>
    </thead>
  ),
}));

jest.mock("../../components/checkins/header/BookingModal", () => ({
  __esModule: true,
  default: () => <div data-cy="booking-modal" />,
}));

jest.mock("../../components/checkins/header/DeleteConfirmationModal", () => ({
  __esModule: true,
  default: () => <div data-cy="delete-modal" />,
}));

jest.mock("../../components/checkins/header/ArchiveConfirmationModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="archive confirmation" data-cy="archive-confirmation-modal">
      <button type="button" onClick={onClose}>
        close archive
      </button>
    </div>
  ),
}));

const baseRow: CheckInRow = {
  bookingRef: "BR1",
  occupantId: "O1",
  checkInDate: "2025-01-03",
  rooms: [],
  firstName: "John",
  lastName: "Doe",
  roomBooked: "101",
  roomAllocated: "101",
  activities: [],
  isFirstForBooking: true,
};

function CheckinParityHarness() {
  const [roomsReady, setRoomsReady] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  return (
    <CheckinsTableView
      selectedDate="2025-01-03"
      onDateChange={jest.fn()}
      username="Pete"
      roomsReady={roomsReady}
      setRoomsReady={setRoomsReady}
      loading={false}
      error={null}
      finalSortedData={[baseRow]}
      guestsByBooking={{ BR1: [baseRow] }}
      eligibleCount={1}
      isEditMode={false}
      isDeleteMode={false}
      isAddGuestMode={false}
      onRowClick={jest.fn()}
      onNewBookingClick={jest.fn()}
      onEditClick={jest.fn()}
      onDeleteClick={jest.fn()}
      onArchiveClick={(event) => {
        event.preventDefault();
        setShowArchiveModal(true);
      }}
      selectedBooking={null}
      bookingToDelete={null}
      showArchiveModal={showArchiveModal}
      closeSelectedBooking={jest.fn()}
      closeBookingToDelete={jest.fn()}
      closeArchiveModal={() => setShowArchiveModal(false)}
      onArchiveComplete={jest.fn()}
      showCancelled={showCancelled}
      onToggleCancelled={() => setShowCancelled((current) => !current)}
      bookingStatuses={{ BR1: "active" }}
    />
  );
}

describe("/checkin parity", () => {
  it("matches baseline selectors and DOM snapshot", () => {
    const { container } = render(<CheckinParityHarness />);

    expect(
      screen.getByRole("heading", { name: /checkins/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /show cancelled/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rooms ready/i }),
    ).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it("supports keyboard toggle and archive modal open/close", async () => {
    const user = userEvent.setup();
    render(<CheckinParityHarness />);

    const cancelledToggle = screen.getByRole("checkbox", {
      name: /show cancelled/i,
    });
    await user.click(cancelledToggle);
    expect(cancelledToggle).toBeChecked();

    const roomsReadyButton = screen.getByRole("button", {
      name: /rooms ready/i,
    });
    roomsReadyButton.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/rooms are set/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /archive/i }));
    expect(screen.getByTestId("archive-confirmation-modal")).toBeInTheDocument();

    const closeArchiveButton = screen.getByRole("button", {
      name: /close archive/i,
    });
    closeArchiveButton.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.queryByTestId("archive-confirmation-modal"),
    ).not.toBeInTheDocument();
  });
});
