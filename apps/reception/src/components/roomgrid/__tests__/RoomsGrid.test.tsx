/* eslint-disable ds/no-raw-color -- test fixtures */
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RoomsGrid from "../RoomsGrid";

jest.useFakeTimers({ toFake: ["Date"] });
jest.setSystemTime(new Date("2025-01-02"));

const mockKnownRooms = ["101"];
const mockGetReservationDataForRoom = jest.fn();

jest.mock("../../../hooks/client/checkin/useRoomConfigs", () => ({
  __esModule: true,
  default: () => ({ knownRooms: mockKnownRooms }),
}));

let mockUnallocatedOccupants: unknown[] = [];

jest.mock("../../../hooks/data/roomgrid/useGridData", () => ({
  __esModule: true,
  default: () => ({
    getReservationDataForRoom: mockGetReservationDataForRoom,
    unallocatedOccupants: mockUnallocatedOccupants,
    loading: false,
    error: null,
  }),
}));

jest.mock("../UnallocatedPanel", () => ({
  __esModule: true,
  default: ({ occupants }: { occupants: unknown[] }) => (
    <div data-testid="unallocated-panel">Unallocated: {occupants.length}</div>
  ),
}));

type RoomGridProps = {
  roomNumber: string;
  startDate: string;
  endDate: string;
  data: unknown[];
};
let mockRoomGrid: (props: RoomGridProps) => JSX.Element;
let user: ReturnType<typeof userEvent.setup>;
jest.mock("../RoomGrid", () => ({
  __esModule: true,
  default: (props: RoomGridProps) => mockRoomGrid(props),
}));

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  mockUnallocatedOccupants = [];
  user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  mockRoomGrid = jest.fn(
    ({ roomNumber, startDate, endDate, data }: RoomGridProps) => (
      <div data-testid="room-grid">
        Room {roomNumber}: {startDate} - {endDate} ({data.length})
      </div>
    )
  );
  mockGetReservationDataForRoom.mockReturnValue([
    {
      id: "bed-1",
      title: "Bed #1",
      info: "",
      startDate: "2025-05-01",
      endDate: "2025-05-02",
      periods: [
        {
          start: "2025-05-01",
          end: "2025-05-02",
          status: "12",
          bookingRef: "BR1",
          occupantId: "O1",
          firstName: "John",
          lastName: "Doe",
          info: "John Doe",
          color: "#fff",
        },
      ],
    },
  ]);
});

describe("RoomsGrid", () => {
  it("renders room grids and updates dates", async () => {
    render(<RoomsGrid />);

    expect(
      screen.getByText("Room 101: 2025-01-01 - 2025-01-15 (1)")
    ).toBeInTheDocument();

    const startInput = screen.getByLabelText(/start/i);
    await user.clear(startInput);
    await user.type(startInput, "2025-01-05");

    expect(
      screen.getByText("Room 101: 2025-01-05 - 2025-01-15 (1)")
    ).toBeInTheDocument();
  });

  it("handles empty room data", () => {
    mockGetReservationDataForRoom.mockReturnValueOnce([]);
    render(<RoomsGrid />);
    expect(
      screen.getByText("Room 101: 2025-01-01 - 2025-01-15 (0)")
    ).toBeInTheDocument();
  });

  // TC-07: UnallocatedPanel is rendered when there are unallocated occupants
  it("TC-07: renders UnallocatedPanel when unallocated occupants are present", () => {
    mockUnallocatedOccupants = [
      {
        bookingRef: "BR-U1",
        occupantId: "OCC-U1",
        firstName: "Jane",
        lastName: "Doe",
        checkInDate: "2025-01-05",
        checkOutDate: "2025-01-10",
        bookedRoom: "102",
        status: "1",
      },
    ];
    render(<RoomsGrid />);
    expect(screen.getByTestId("unallocated-panel")).toBeInTheDocument();
    expect(screen.getByText("Unallocated: 1")).toBeInTheDocument();
  });

  // TC-08: UnallocatedPanel is NOT rendered when there are no unallocated occupants
  it("TC-08: does not render UnallocatedPanel when no unallocated occupants", () => {
    render(<RoomsGrid />);
    expect(screen.queryByTestId("unallocated-panel")).not.toBeInTheDocument();
  });
});
