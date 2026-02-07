import "@testing-library/jest-dom";

import type { TClickCellEventData } from "@daminort/reservation-grid";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { GridReservationRow } from "../../../hooks/data/roomgrid/useGridData";
import RoomGrid from "../RoomGrid";

/* -------------------------------------------------------------------------- */
/* Mock ReservationGrid                                                       */
/* -------------------------------------------------------------------------- */
/* eslint-disable no-var */
var mockEvent: TClickCellEventData;
/* eslint-enable no-var */

jest.mock("@daminort/reservation-grid", () => ({
  __esModule: true,
  ReservationGrid: ({ onClickCell }: { onClickCell: (e: TClickCellEventData) => void }) => (
    <button data-testid="reservation-grid" onClick={() => onClickCell(mockEvent)}>
      grid
    </button>
  ),
}));

jest.mock("../BookingDetailsModal", () => ({
  __esModule: true,
  default: ({
    bookingDetails,
    onClose,
  }: {
    bookingDetails: { id: string; bookingRef?: string; firstName?: string };
    onClose: () => void;
  }) => (
    <div data-testid="booking-details-modal">
      <div>Booking Details</div>
      <div>{bookingDetails.id}</div>
      {bookingDetails.bookingRef && (
        <>
          <div>{bookingDetails.bookingRef}</div>
          <div>{bookingDetails.firstName}</div>
        </>
      )}
      <button aria-label="close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

/* -------------------------------------------------------------------------- */
/* Test data                                                                  */
/* -------------------------------------------------------------------------- */
const rows: GridReservationRow[] = [
  {
    id: "bed-1",
    title: "Bed #1",
    info: "BookingRef: BR1",
    startDate: "2025-05-01",
    endDate: "2025-05-03",
    color: "#fff",
    periods: [
      {
        start: "2025-05-01",
        end: "2025-05-03",
        status: "12",
        bookingRef: "BR1",
        occupantId: "O1",
        firstName: "Alice",
        lastName: "A",
        info: "Alice A",
        color: "#fff",
      },
    ],
  },
];

const baseProps = {
  roomNumber: "101",
  startDate: "2025-05-01",
  endDate: "2025-05-10",
  data: rows,
};

const overlappingRows: GridReservationRow[] = [
  {
    id: "bed-1",
    title: "Bed #1",
    info: "BookingRef: BR1, BR2",
    startDate: "2025-05-01",
    endDate: "2025-05-05",
    color: "#fff",
    periods: [
      {
        start: "2025-05-01",
        end: "2025-05-04",
        status: "12",
        bookingRef: "BR1",
        occupantId: "O1",
        firstName: "Alice",
        lastName: "A",
        info: "Alice A",
        color: "#fff",
      },
      {
        start: "2025-05-02",
        end: "2025-05-05",
        status: "14",
        bookingRef: "BR2",
        occupantId: "O2",
        firstName: "Bob",
        lastName: "B",
        info: "Bob B",
        color: "#fff",
      },
    ],
  },
];

beforeEach(() => {
  mockEvent = { id: "", date: "", dayType: "single", dayStatus: "" };
});

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("RoomGrid", () => {

  it("opens modal with booking info on double click", async () => {
    render(<RoomGrid {...baseProps} />);

    mockEvent = {
      id: "bed-1",
      date: "2025-05-01",
      dayType: "single",
      dayStatus: "12",
    };

    await userEvent.dblClick(screen.getByTestId("reservation-grid"));

    expect(screen.getByText(/Booking Details/)).toBeInTheDocument();
    expect(screen.getByText("bed-1")).toBeInTheDocument();
    expect(screen.getByText("BR1")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/close/i));

    expect(screen.queryByText(/Booking Details/)).not.toBeInTheDocument();
  });

  it("applies dark mode classes", () => {
    document.documentElement.classList.add("dark");
    const { container } = render(<RoomGrid {...baseProps} />);
    const wrapper = container.querySelector("div.dark") as HTMLElement;
    expect(wrapper).toHaveClass("dark:bg-darkSurface", "dark:border-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("handles empty room data", async () => {
    render(
      <RoomGrid
        roomNumber="101"
        startDate="2025-05-01"
        endDate="2025-05-10"
        data={[]}
      />
    );

    mockEvent = {
      id: "bed-1",
      date: "2025-05-02",
      dayType: "single",
      dayStatus: "free",
    };

    await userEvent.dblClick(screen.getByTestId("reservation-grid"));

    expect(screen.getByText(/Booking Details/)).toBeInTheDocument();
    expect(screen.getByText("bed-1")).toBeInTheDocument();
    expect(screen.queryByText("BR1")).not.toBeInTheDocument();
  });

  it("uses first overlapping booking period", async () => {
    render(
      <RoomGrid
        roomNumber="101"
        startDate="2025-05-01"
        endDate="2025-05-10"
        data={overlappingRows}
      />
    );

    mockEvent = {
      id: "bed-1",
      date: "2025-05-02",
      dayType: "between",
      dayStatus: "12",
    };

    await userEvent.dblClick(screen.getByTestId("reservation-grid"));

    expect(screen.getByText("BR1")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("BR2")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });
});
