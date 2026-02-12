import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CheckInRow } from "../../../types/component/CheckinRow";
import * as dateUtils from "../../../utils/dateUtils";
import CheckinsTable from "../CheckinsTable";

const useAuthMock = jest.fn();
const useSearchParamsMock = jest.fn();
const checkinsTableDataMock = jest.fn();
const addReplicatedGuestToBookingMock = jest.fn();
const archiveEligibleCountMock = jest.fn();
const checkinsModesMock = jest.fn();
const sharedDailyToggleMock = jest.fn();
const showToastMock = jest.fn();

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

jest.mock("../../../hooks/data/useCheckinsTableData", () => ({
  __esModule: true,
  default: (args: unknown) => checkinsTableDataMock(args),
}));

jest.mock("../../../hooks/mutations/useAddGuestToBookingMutation", () => ({
  __esModule: true,
  default: () => ({
    addReplicatedGuestToBooking: addReplicatedGuestToBookingMock,
  }),
}));

jest.mock("../../../hooks/mutations/useArchiveEligibleCount", () => ({
  __esModule: true,
  default: () => archiveEligibleCountMock(),
}));

jest.mock("../../../hooks/utilities/useCheckinsModes", () => ({
  __esModule: true,
  default: () => checkinsModesMock(),
}));

jest.mock("../../../hooks/utilities/useSharedDailyToggle", () => ({
  __esModule: true,
  default: () => sharedDailyToggleMock(),
}));

jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: Parameters<typeof showToastMock>) =>
    showToastMock(...args),
}));

jest.mock("../BookingRow", () => ({
  __esModule: true,
  default: ({
    booking,
    onRowClick,
  }: {
    booking: CheckInRow;
    onRowClick?: (booking: CheckInRow) => void;
  }) => (
    <tr data-cy="booking-row" onClick={() => onRowClick?.(booking)}>
      <td>{booking.firstName}</td>
    </tr>
  ),
}));

jest.mock("../TableHeader", () => ({
  __esModule: true,
  default: () => <thead />,
}));

jest.mock("../header/BookingModal", () => ({
  __esModule: true,
  default: () => <div data-cy="booking-modal" />,
}));

jest.mock("../header/DeleteConfirmationModal", () => ({
  __esModule: true,
  default: () => <div data-cy="delete-modal" />,
}));

jest.mock("../header/ArchiveConfirmationModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-cy="archive-modal">
      <button onClick={onClose}>close</button>
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

function createModes(overrides: Partial<ReturnType<typeof defaultModes>>) {
  return { ...defaultModes(), ...overrides };
}

function defaultModes() {
  return {
    isEditMode: false,
    isDeleteMode: false,
    isAddGuestMode: false,
    showArchiveModal: false,
    selectedBooking: null,
    bookingToDelete: null,
    setSelectedBooking: jest.fn(),
    setBookingToDelete: jest.fn(),
    toggleAddGuestMode: jest.fn(),
    toggleEditMode: jest.fn(),
    toggleDeleteMode: jest.fn(),
    openArchiveModal: jest.fn(),
    closeArchiveModal: jest.fn(),
  };
}

describe("CheckinsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuthMock.mockReturnValue({
      user: { user_name: "Pete", email: "p@example.com" },
    });
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("selectedDate=2025-01-03"),
    );
    checkinsTableDataMock.mockReturnValue({
      rows: [baseRow],
      loading: false,
      error: null,
      validationError: null,
    });
    addReplicatedGuestToBookingMock.mockResolvedValue(undefined);
    archiveEligibleCountMock.mockReturnValue({
      eligibleCount: 0,
      refresh: jest.fn(),
    });
    checkinsModesMock.mockReturnValue(defaultModes());
    sharedDailyToggleMock.mockReturnValue([false, jest.fn()]);
  });

  it("derives selected date from search params", () => {
    render(<CheckinsTable />);

    expect(screen.getByTestId("booking-row")).toBeInTheDocument();
    expect(checkinsTableDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedDate: "2025-01-03",
        daysBefore: 1,
        daysAfter: 5,
      }),
    );
  });

  it("routes row clicks to edit mode selection", async () => {
    const modes = createModes({ isEditMode: true });
    checkinsModesMock.mockReturnValue(modes);
    const user = userEvent.setup();

    render(<CheckinsTable />);
    await user.click(screen.getByTestId("booking-row"));

    expect(modes.setSelectedBooking).toHaveBeenCalledWith(baseRow);
  });

  it("routes row clicks to delete mode selection", async () => {
    const modes = createModes({ isDeleteMode: true });
    checkinsModesMock.mockReturnValue(modes);
    const user = userEvent.setup();

    render(<CheckinsTable />);
    await user.click(screen.getByTestId("booking-row"));

    expect(modes.setBookingToDelete).toHaveBeenCalledWith(baseRow);
  });

  it("routes row clicks to add-guest mode replication", async () => {
    const modes = createModes({ isAddGuestMode: true });
    checkinsModesMock.mockReturnValue(modes);
    const user = userEvent.setup();

    render(<CheckinsTable />);
    await user.click(screen.getByTestId("booking-row"));

    expect(addReplicatedGuestToBookingMock).toHaveBeenCalledWith("BR1", "O1", {
      firstName: "Auto",
      lastName: "Created",
    });
    expect(modes.toggleAddGuestMode).toHaveBeenCalled();
  });

  it("opens archive modal from header action", async () => {
    const modes = createModes();
    checkinsModesMock.mockReturnValue(modes);
    const user = userEvent.setup();

    render(<CheckinsTable />);
    await user.click(screen.getByRole("button", { name: /archive/i }));

    expect(modes.openArchiveModal).toHaveBeenCalled();
  });

  it("closes archive modal from modal action", async () => {
    const modes = createModes({ showArchiveModal: true });
    checkinsModesMock.mockReturnValue(modes);
    const user = userEvent.setup();

    render(<CheckinsTable />);
    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(modes.closeArchiveModal).toHaveBeenCalled();
  });

  it("defaults non-Pete users to local today when no search param is present", () => {
    const getLocalTodaySpy = jest
      .spyOn(dateUtils, "getLocalToday")
      .mockReturnValue("2025-07-04");
    useAuthMock.mockReturnValue({
      user: { user_name: "Jane", email: "j@example.com" },
    });
    useSearchParamsMock.mockReturnValue(new URLSearchParams(""));
    checkinsTableDataMock.mockReturnValue({
      rows: [],
      loading: false,
      error: null,
      validationError: null,
    });

    render(<CheckinsTable />);

    expect(checkinsTableDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedDate: "2025-07-04",
        daysBefore: 0,
        daysAfter: 1,
      }),
    );
    getLocalTodaySpy.mockRestore();
  });
});
