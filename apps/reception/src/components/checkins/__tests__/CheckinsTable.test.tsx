import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CheckInRow } from "../../../types/component/CheckinRow";
 

// Suppress native alert calls in jsdom
globalThis.alert = jest.fn();

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
/* eslint-disable react-hooks/rules-of-hooks */
var setSelectedBookingMock: jest.Mock;
var setBookingToDeleteMock: jest.Mock;
var toggleAddGuestModeMock: jest.Mock;
var toggleEditModeMock: jest.Mock;
var toggleDeleteModeMock: jest.Mock;
var openArchiveModalMock: jest.Mock;
var closeArchiveModalMock: jest.Mock;
var addGuestMock: jest.Mock;
var refreshCountMock: jest.Mock;
var setRoomsReadyMock: jest.Mock;
/* eslint-enable no-var */

async function loadTable() {
  jest.resetModules();

  setSelectedBookingMock = jest.fn();
  setBookingToDeleteMock = jest.fn();
  toggleAddGuestModeMock = jest.fn();
  toggleEditModeMock = jest.fn();
  toggleDeleteModeMock = jest.fn();
  openArchiveModalMock = jest.fn();
  closeArchiveModalMock = jest.fn();
  addGuestMock = jest.fn().mockResolvedValue(undefined);
  refreshCountMock = jest.fn();
  setRoomsReadyMock = jest.fn();

  jest.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: { user_name: "Pete", email: "p@example.com" } }),
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

  jest.doMock("../../../hooks/data/useCheckinsTableData", () => ({
    __esModule: true,
    default: () => ({
      rows: [baseRow],
      loading: false,
      error: null,
      validationError: null,
    }),
  }));

  jest.doMock("../../../hooks/mutations/useAddGuestToBookingMutation", () => ({
    __esModule: true,
    default: () => ({ addReplicatedGuestToBooking: addGuestMock }),
  }));

  jest.doMock("../../../hooks/mutations/useArchiveEligibleCount", () => ({
    __esModule: true,
    default: () => ({ eligibleCount: 0, refresh: refreshCountMock }),
  }));

  jest.doMock("../../../hooks/utilities/useSharedDailyToggle", () => ({
    __esModule: true,
    default: () => [false, setRoomsReadyMock],
  }));

  jest.doMock("../../../hooks/utilities/useCheckinsModes", () => {
     
    const React: typeof import("react") = require("react");
    return {
      __esModule: true,
      default: () => {
         
        const [isEditMode, setIsEditMode] = React.useState(false);
         
        const [isDeleteMode, setIsDeleteMode] = React.useState(false);
         
        const [isAddGuestMode, setIsAddGuestMode] = React.useState(false);
         
        const [showArchiveModal, setShowArchiveModal] = React.useState(false);
        return {
          isEditMode,
          isDeleteMode,
          isAddGuestMode,
          showArchiveModal,
          selectedBooking: null,
          bookingToDelete: null,
          setSelectedBooking: setSelectedBookingMock,
          setBookingToDelete: setBookingToDeleteMock,
          toggleAddGuestMode: () => {
            toggleAddGuestModeMock();
            setIsAddGuestMode((p) => !p);
            setIsEditMode(false);
            setIsDeleteMode(false);
          },
          toggleEditMode: () => {
            toggleEditModeMock();
            setIsEditMode((p) => !p);
            setIsDeleteMode(false);
            setIsAddGuestMode(false);
          },
          toggleDeleteMode: () => {
            toggleDeleteModeMock();
            setIsDeleteMode((p) => !p);
            setIsEditMode(false);
            setIsAddGuestMode(false);
          },
          openArchiveModal: () => {
            openArchiveModalMock();
            setShowArchiveModal(true);
            setIsEditMode(false);
            setIsDeleteMode(false);
            setIsAddGuestMode(false);
          },
          closeArchiveModal: () => {
            closeArchiveModalMock();
            setShowArchiveModal(false);
          },
        };
      },
    };
  });

  jest.doMock("react-router-dom", async () => {
    const actual = jest.requireActual(
      "react-router-dom"
    );
    return {
      ...actual,
      useLocation: () => ({ state: { selectedDate: "2025-01-03" } }),
    };
  });

  jest.doMock("../BookingRow", () => ({
    __esModule: true,
    default: ({ onRowClick, booking }: { onRowClick?: (b: CheckInRow) => void; booking: CheckInRow }) => (
      <tr data-testid="booking-row" onClick={() => onRowClick?.(booking)}>
        <td>{booking.firstName}</td>
      </tr>
    ),
  }));

  jest.doMock("../TableHeader", () => ({ __esModule: true, default: () => <thead /> }));
  jest.doMock("../header/BookingModal", () => ({ __esModule: true, default: () => <div data-testid="booking-modal" /> }));
  jest.doMock("../header/DeleteConfirmationModal", () => ({ __esModule: true, default: () => <div data-testid="delete-modal" /> }));
  jest.doMock("../header/ArchiveConfirmationModal", () => ({
    __esModule: true,
    default: ({ onClose }: { onClose: () => void }) => (
      <div data-testid="archive-modal">
        <button onClick={onClose}>close</button>
      </div>
    ),
  }));

  const mod = await import("../CheckinsTable");
  return { Comp: mod.default, baseRow };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("CheckinsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("derives selected date from route state", async () => {
    const { Comp } = await loadTable();
    render(<Comp />);
    expect(screen.getByTestId("booking-row")).toBeInTheDocument();
  });

  it("handles row clicks for each mode", async () => {
    const { Comp, baseRow } = await loadTable();
    render(<Comp />);
    const row = screen.getByTestId("booking-row");

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    await userEvent.click(row);
    expect(setSelectedBookingMock).toHaveBeenCalledWith(baseRow);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    await userEvent.click(row);
    expect(setBookingToDeleteMock).toHaveBeenCalledWith(baseRow);

    await userEvent.click(screen.getByRole("button", { name: /new booking/i }));
    await userEvent.click(row);
    expect(addGuestMock).toHaveBeenCalledWith("BR1", "O1", {
      firstName: "Auto",
      lastName: "Created",
    });
  });

  it("opens and closes archive modal", async () => {
    const { Comp } = await loadTable();
    render(<Comp />);

    await userEvent.click(screen.getByRole("button", { name: /archive/i }));
    expect(openArchiveModalMock).toHaveBeenCalled();
    expect(screen.getByTestId("archive-modal")).toBeInTheDocument();

    await userEvent.click(screen.getByText("close"));
    expect(closeArchiveModalMock).toHaveBeenCalled();
    expect(screen.queryByTestId("archive-modal")).not.toBeInTheDocument();
  });

  it("defaults to local today when route state is absent for non-Pete users", async () => {
    jest.resetModules();

    const getLocalTodayMock = jest.fn(() => "2025-07-04");
    const useCheckinsTableDataMock = jest.fn(() => ({
      rows: [],
      loading: false,
      error: null,
      validationError: null,
    }));

    jest.doMock("../../../context/AuthContext", () => ({
      useAuth: () => ({ user: { user_name: "Jane", email: "j@example.com" } }),
    }));

    jest.doMock("../../../hooks/data/useCheckinsTableData", () => ({
      __esModule: true,
      default: useCheckinsTableDataMock,
    }));

    jest.doMock("../../../utils/dateUtils", async () => {
      const actual = jest.requireActual("../../../utils/dateUtils");
      return { ...actual, getLocalToday: getLocalTodayMock };
    });

    jest.doMock("react-router-dom", async () => {
      const actual = jest.requireActual(
        "react-router-dom",
      );
      return { ...actual, useLocation: () => ({ state: undefined }) };
    });

    const { default: Comp } = await import("../CheckinsTable");
    render(<Comp />);

    expect(useCheckinsTableDataMock).toHaveBeenCalledWith(
      expect.objectContaining({ selectedDate: "2025-07-04" }),
    );
  });
});

