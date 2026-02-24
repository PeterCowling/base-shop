import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { fireEvent,render, screen } from "@testing-library/react";

import { Grid } from "../components/Grid";
import { Header } from "../components/Header";
import { Row } from "../components/Row";
import { initialValue,MainProvider } from "../context";

jest.mock("react-dnd", () => ({
  __esModule: true,
  DndProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useDrag: () => [{ isDragging: false }, (node: unknown) => node],
  useDrop: () => [{ handlerId: null, isOver: false }, (node: unknown) => node],
}));

jest.mock("react-dnd-html5-backend", () => ({
  __esModule: true,
  HTML5Backend: {},
}));

function getDataTestId(id: string): HTMLElement | null {
  return document.querySelector(`[data-testid="${id}"]`);
}

// Helper to render components with context
const renderWithProvider = (
  ui: React.ReactElement,
  value: typeof initialValue
) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      <MainProvider value={value}>{ui}</MainProvider>
    </DndProvider>
  );
};

const start = "2023-01-01";
const end = "2023-01-03";

const periodsMulti = [
  { start: "2023-01-01", end: "2023-01-03", status: "confirmed" },
];
const periodsSingle = [
  { start: "2023-01-02", end: "2023-01-03", status: "awaiting" },
];

const gridData = [
  { id: "r1", title: "Room 1", info: "Info 1", periods: periodsMulti },
  { id: "r2", title: "Room 2", info: "Info 2", periods: periodsSingle },
];

describe("Grid and related components", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-02"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders rows, header and handles selection and clicks", () => {
    const onTitle = jest.fn();
    const onCell = jest.fn();

    render(
      <DndProvider backend={HTML5Backend}>
        <Grid
          start={start}
          end={end}
          data={gridData}
          selectedRows={["r1"]}
          selectedColumns={["2023-01-02"]}
          highlightToday
          showInfo
          onClickTitle={onTitle}
          onClickCell={onCell}
        />
      </DndProvider>
    );

    // Header present
    expect(getDataTestId("header")).toBeInTheDocument();

    // Row titles rendered
    const title1 = getDataTestId("title-r1") as HTMLElement;
    expect(title1).toHaveTextContent("Room 1");
    expect(title1).toHaveClass("selected");

    // Selected column cell should have both selected and today classes
    const selectedCell = getDataTestId("cell-r1-2023-01-02") as HTMLElement;
    expect(selectedCell).toHaveClass("selected");
    expect(selectedCell).toHaveClass("today");

    // Click handlers
    fireEvent.click(title1);
    expect(onTitle).toHaveBeenCalledWith("r1");

    fireEvent.click(getDataTestId("cell-r1-2023-01-01") as HTMLElement);
    expect(onCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        date: "2023-01-01",
        dayType: "single.start",
      })
    );

    fireEvent.click(getDataTestId("cell-r2-2023-01-02") as HTMLElement);
    expect(onCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r2",
        date: "2023-01-02",
        dayType: "single.start",
      })
    );
  });

  it("renders Header standalone with selected columns and today highlight", () => {
    const value = {
      ...initialValue,
      start,
      end,
      highlightToday: true,
      showInfo: true,
      selectedColumns: ["2023-01-01"],
    };

    renderWithProvider(
      <table>
        <Header title="Rooms" info="Info" />
      </table>,
      value
    );

    expect(getDataTestId("title")).toHaveTextContent("Rooms");
    // Selected column
    const sel = getDataTestId("cell-day-2023-01-01") as HTMLElement;
    expect(sel).toHaveClass("selected");
    // Today highlight
    const today = getDataTestId("cell-day-2023-01-02") as HTMLElement;
    expect(today).toHaveClass("today");
  });

  it("renders Row without info column when showInfo is false", () => {
    const value = {
      ...initialValue,
      start,
      end,
      showInfo: false,
    };

    renderWithProvider(
      <table>
        <tbody>
          <Row
            id="r1"
            title="Room 1"
            info="Info"
            periods={periodsMulti}
            selected={false}
          />
        </tbody>
      </table>,
      value
    );

    expect(getDataTestId("info-r1")).not.toBeInTheDocument();
  });
});
