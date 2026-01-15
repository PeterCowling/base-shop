import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
/* eslint-disable react-hooks/rules-of-hooks */

// Suppress native alert calls in jsdom
globalThis.alert = vi.fn();

import type { CheckInRow } from "../../../types/component/CheckinRow";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
/* eslint-disable react-hooks/rules-of-hooks */
var setSelectedBookingMock: ReturnType<typeof vi.fn>;
var setBookingToDeleteMock: ReturnType<typeof vi.fn>;
var toggleAddGuestModeMock: ReturnType<typeof vi.fn>;
var toggleEditModeMock: ReturnType<typeof vi.fn>;
var toggleDeleteModeMock: ReturnType<typeof vi.fn>;
var openArchiveModalMock: ReturnType<typeof vi.fn>;
var closeArchiveModalMock: ReturnType<typeof vi.fn>;
var addGuestMock: ReturnType<typeof vi.fn>;
var refreshCountMock: ReturnType<typeof vi.fn>;
var setRoomsReadyMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

async function loadTable() {
  vi.resetModules();

  setSelectedBookingMock = vi.fn();
  setBookingToDeleteMock = vi.fn();
  toggleAddGuestModeMock = vi.fn();
  toggleEditModeMock = vi.fn();
  toggleDeleteModeMock = vi.fn();
  openArchiveModalMock = vi.fn();
  closeArchiveModalMock = vi.fn();
  addGuestMock = vi.fn().mockResolvedValue(undefined);
  refreshCountMock = vi.fn();
  setRoomsReadyMock = vi.fn();

  vi.doMock("../../../context/AuthContext", () => ({
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

  vi.doMock("../../../hooks/data/useCheckinsTableData", () => ({
    __esModule: true,
    default: () => ({
      rows: [baseRow],
      loading: false,
      error: null,
      validationError: null,
    }),
  }));

  vi.doMock("../../../hooks/mutations/useAddGuestToBookingMutation", () => ({
    __esModule: true,
    default: () => ({ addReplicatedGuestToBooking: addGuestMock }),
  }));

  vi.doMock("../../../hooks/mutations/useArchiveEligibleCount", () => ({
    __esModule: true,
    default: () => ({ eligibleCount: 0, refresh: refreshCountMock }),
  }));

  vi.doMock("../../../hooks/utilities/useSharedDailyToggle", () => ({
    __esModule: true,
    default: () => [false, setRoomsReadyMock],
  }));

  vi.doMock("../../../hooks/utilities/useCheckinsModes", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React: typeof import("react") = require("react");
    return {
      __esModule: true,
      default: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isEditMode, setIsEditMode] = React.useState(false);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isDeleteMode, setIsDeleteMode] = React.useState(false);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isAddGuestMode, setIsAddGuestMode] = React.useState(false);
        // eslint-disable-next-line react-hooks/rules-of-hooks
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

  vi.doMock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom"
    );
    return {
      ...actual,
      useLocation: () => ({ state: { selectedDate: "2025-01-03" } }),
    };
  });

  vi.doMock("../BookingRow", () => ({
    __esModule: true,
    default: ({ onRowClick, booking }: { onRowClick?: (b: CheckInRow) => void; booking: CheckInRow }) => (
      <tr data-testid="booking-row" onClick={() => onRowClick?.(booking)}>
        <td>{booking.firstName}</td>
      </tr>
    ),
  }));

  vi.doMock("../TableHeader", () => ({ __esModule: true, default: () => <thead /> }));
  vi.doMock("../header/BookingModal", () => ({ __esModule: true, default: () => <div data-testid="booking-modal" /> }));
  vi.doMock("../header/DeleteConfirmationModal", () => ({ __esModule: true, default: () => <div data-testid="delete-modal" /> }));
  vi.doMock("../header/ArchiveConfirmationModal", () => ({
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
    vi.clearAllMocks();
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
    vi.resetModules();

    const getLocalTodayMock = vi.fn(() => "2025-07-04");
    const useCheckinsTableDataMock = vi.fn(() => ({
      rows: [],
      loading: false,
      error: null,
      validationError: null,
    }));

    vi.doMock("../../../context/AuthContext", () => ({
      useAuth: () => ({ user: { user_name: "Jane", email: "j@example.com" } }),
    }));

    vi.doMock("../../../hooks/data/useCheckinsTableData", () => ({
      __esModule: true,
      default: useCheckinsTableDataMock,
    }));

    vi.doMock("../../../utils/dateUtils", async () => {
      const actual = await vi.importActual<
        typeof import("../../../utils/dateUtils")
      >("../../../utils/dateUtils");
      return { ...actual, getLocalToday: getLocalTodayMock };
    });

    vi.doMock("react-router-dom", async () => {
      const actual = await vi.importActual<typeof import("react-router-dom")>(
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

