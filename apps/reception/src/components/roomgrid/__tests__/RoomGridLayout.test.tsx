import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import type { GridReservationRow } from "../../../hooks/data/roomgrid/useGridData";
import { formatDate } from "../../../utils/dateUtils";
import RoomGrid from "../RoomGrid";

// Mock ReservationGrid to render rows and cells based on props
jest.mock("@daminort/reservation-grid", () => ({
  __esModule: true,
  ReservationGrid: ({ start, end, data }: { start: string; end: string; data: GridReservationRow[] }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(formatDate(d));
    }
    return (
      <div data-testid="reservation-grid">
        {data.map((row) => (
          <div key={row.id} data-testid={`row-${row.id}`}>
            {days.map((date) => (
              <div key={date} data-testid={`cell-${row.id}-${date}`}></div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

describe("RoomGrid cell layout", () => {
  it("renders a cell for each day in the range", () => {
    const rows: GridReservationRow[] = [
      {
        id: "bed-1",
        title: "Bed #1",
        info: "",
        startDate: "2025-05-01",
        endDate: "2025-05-03",
        color: "#fff",
        periods: [],
      },
      {
        id: "bed-2",
        title: "Bed #2",
        info: "",
        startDate: "2025-05-01",
        endDate: "2025-05-03",
        color: "#fff",
        periods: [],
      },
    ];

    render(
      <RoomGrid
        data={rows}
        roomNumber="101"
        startDate="2025-05-01"
        endDate="2025-05-03"
      />
    );

    expect(screen.getAllByTestId(/cell-bed-1-/)).toHaveLength(3);
    expect(screen.getAllByTestId(/cell-bed-2-/)).toHaveLength(3);
  });
});
