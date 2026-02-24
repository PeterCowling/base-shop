/* eslint-disable ds/no-raw-color -- test fixtures */
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

type TStatus = "awaiting" | "confirmed" | "disabled";

function getDataTestId(id: string): HTMLElement | null {
  return document.querySelector(`[data-testid="${id}"]`);
}

const data: TGridProps<TStatus>["data"] = [
  {
    id: "r1",
    title: "Bed 1",
    info: "Guest A",
    periods: [
      {
        start: "2025-05-05",
        end: "2025-05-06",
        status: "confirmed",
      },
    ],
  },
];

describe("ReservationGrid capability contract", () => {
  afterEach(() => {
    const root = document.documentElement.style;
    root.removeProperty("--rvg-font-face");
    root.removeProperty("--rvg-width-title");
    root.removeProperty("--rvg-date-status-confirmed");
  });

  it("supports info visibility, selection state, and title click callback", async () => {
    const onClickTitle = jest.fn();

    const { rerender } = render(
      <ReservationGrid<TStatus>
        start="2025-05-05"
        end="2025-05-06"
        title="Beds"
        info="Guests"
        showInfo
        selectedRows={["r1"]}
        selectedColumns={["2025-05-05"]}
        data={data}
        onClickTitle={onClickTitle}
      />
    );

    expect(getDataTestId("info")).toHaveTextContent("Guests");
    expect(getDataTestId("info-r1")).toHaveTextContent("Guest A");
    expect(getDataTestId("title-r1")).toHaveClass("selected");
    expect(getDataTestId("cell-day-2025-05-05")).toHaveClass("selected");

    await userEvent.click(getDataTestId("title-r1") as HTMLElement);
    expect(onClickTitle).toHaveBeenCalledWith("r1");

    rerender(
      <ReservationGrid<TStatus>
        start="2025-05-05"
        end="2025-05-06"
        title="Beds"
        info="Guests"
        showInfo={false}
        data={data}
      />
    );

    expect(getDataTestId("info")).not.toBeInTheDocument();
    expect(getDataTestId("info-r1")).not.toBeInTheDocument();
  });

  it("supports title/info render callbacks", () => {
    render(
      <ReservationGrid<TStatus>
        start="2025-05-05"
        end="2025-05-06"
        title="Beds"
        info="Guests"
        showInfo
        data={data}
        renderTitle={(row) => <span data-testid={`custom-title-${row.id}`}>T-{row.id}</span>}
        renderInfo={(row) => <span data-testid={`custom-info-${row.id}`}>I-{row.id}</span>}
      />
    );

    expect(getDataTestId("custom-title-r1")).toHaveTextContent("T-r1");
    expect(getDataTestId("custom-info-r1")).toHaveTextContent("I-r1");
  });

  it("accepts full theme surface and emits click payload from core props", async () => {
    const onClickCell = jest.fn();

    render(
      <ReservationGrid<TStatus>
        start="2025-05-05"
        end="2025-05-06"
        title="Beds"
        data={data}
        onClickCell={onClickCell}
        theme={{
          "font.face": "serif",
          "font.size": "15px",
          "color.text": "#123456",
          "color.background": "#ffffff",
          "color.border": "#eeeeee",
          "color.today": "#defdef",
          "color.selected": "#fef3d0",
          "color.weekend": "#fafafa",
          "width.title": "42%",
          "width.info": "58%",
          "date.status": {
            free: "transparent",
            disabled: "#999999",
            awaiting: "#cccccc",
            confirmed: "#006490",
          },
        }}
      />
    );

    await userEvent.click(getDataTestId("cell-r1-2025-05-05") as HTMLElement);

    expect(onClickCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        date: "2025-05-05",
        dayType: "single.start",
        dayStatus: ["confirmed"],
      })
    );

    const root = document.documentElement.style;
    expect(root.getPropertyValue("--rvg-font-face").trim()).toBe("serif");
    expect(root.getPropertyValue("--rvg-width-title").trim()).toBe("42%");
    expect(root.getPropertyValue("--rvg-date-status-confirmed").trim()).toBe(
      "#006490"
    );
  });

  it("falls back to english day labels for unknown locale keys", () => {
    render(
      <ReservationGrid<TStatus>
        start="2025-05-05"
        end="2025-05-05"
        title="Beds"
        data={data}
        locale={"zz" as unknown as "en"}
      />
    );

    expect(getDataTestId("cell-day-2025-05-05")).toHaveTextContent("Mo");
  });
});
