import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(new Date("2025-01-02"));

const mockKnownRooms = ["101"];
const mockGetReservationDataForRoom = vi.fn();

vi.mock("../../../hooks/client/checkin/useRoomConfigs", () => ({
  __esModule: true,
  default: () => ({ knownRooms: mockKnownRooms }),
}));

vi.mock("../../../hooks/data/roomgrid/useGridData", () => ({
  __esModule: true,
  default: () => ({
    getReservationDataForRoom: mockGetReservationDataForRoom,
    loading: false,
    error: null,
  }),
}));

type RoomGridProps = {
  roomNumber: string;
  startDate: string;
  endDate: string;
  data: unknown[];
};
let mockRoomGrid: (props: RoomGridProps) => JSX.Element;
vi.mock("../RoomGrid", () => ({
  __esModule: true,
  default: (props: RoomGridProps) => mockRoomGrid(props),
}));

import RoomsGrid from "../RoomsGrid";

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  mockRoomGrid = vi.fn(
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
      periods: [],
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
    await userEvent.clear(startInput);
    await userEvent.type(startInput, "2025-01-05");

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
});
