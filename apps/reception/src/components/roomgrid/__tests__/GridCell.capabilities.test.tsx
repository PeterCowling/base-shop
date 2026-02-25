import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReservationGrid, type TGridProps } from "../ReservationGrid";

jest.mock("react-dnd", () => {
  const React = require("react") as typeof import("react");

  return {
    __esModule: true,
    DndProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useDrag: () => [{ isDragging: false }, (node: unknown) => node],
    useDrop: () => [{ handlerId: null, isOver: false }, (node: unknown) => node],
  };
});

jest.mock("react-dnd-html5-backend", () => ({
  __esModule: true,
  HTML5Backend: {},
}));

type TStatus = "awaiting" | "confirmed";

function getDataTestId(id: string): HTMLElement | null {
  return document.querySelector(`[data-testid="${id}"]`);
}

describe("GridCell capability contract", () => {
  it("emits intersection type and full dayStatus payload for overlapping periods", async () => {
    const onClickCell = jest.fn();
    const data: TGridProps<TStatus>["data"] = [
      {
        id: "r1",
        title: "Bed 1",
        info: "Overlap row",
        periods: [
          { start: "2025-05-01", end: "2025-05-04", status: "awaiting" },
          { start: "2025-05-02", end: "2025-05-05", status: "confirmed" },
        ],
      },
    ];

    const { container } = render(
      <ReservationGrid<TStatus>
        start="2025-05-01"
        end="2025-05-05"
        title="Beds"
        data={data}
        onClickCell={onClickCell}
      />
    );

    const cell = getDataTestId("cell-r1-2025-05-02") as HTMLElement;
    await userEvent.click(cell);

    expect(onClickCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        date: "2025-05-02",
        dayType: "intersection",
        dayStatus: ["awaiting", "confirmed"],
      })
    );

    expect(container.querySelector("[data-cy='intersection']")).toBeInTheDocument();
  });

  it("emits single.free and empty dayStatus for cells with no matching period", async () => {
    const onClickCell = jest.fn();
    const data: TGridProps<TStatus>["data"] = [
      {
        id: "r1",
        title: "Bed 1",
        info: "No bookings",
        periods: [],
      },
    ];

    const { container } = render(
      <ReservationGrid<TStatus>
        start="2025-05-01"
        end="2025-05-01"
        title="Beds"
        data={data}
        onClickCell={onClickCell}
      />
    );

    await userEvent.click(getDataTestId("cell-r1-2025-05-01") as HTMLElement);

    expect(onClickCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        date: "2025-05-01",
        dayType: "single.free",
        dayStatus: [],
      })
    );

    expect(container.querySelector("[data-cy='single.free']")).toBeInTheDocument();
  });
});
