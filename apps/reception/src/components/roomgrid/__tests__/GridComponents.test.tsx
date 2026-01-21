import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";

import { Grid } from "../components/Grid";
import { Header } from "../components/Header";
import { Row } from "../components/Row";
import { MainProvider, initialValue } from "../context";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
    expect(screen.getByTestId("header")).toBeInTheDocument();

    // Row titles rendered
    const title1 = screen.getByTestId("title-r1");
    expect(title1).toHaveTextContent("Room 1");
    expect(title1).toHaveClass("selected");

    // Selected column cell should have both selected and today classes
    const selectedCell = screen.getByTestId("cell-r1-2023-01-02");
    expect(selectedCell).toHaveClass("selected");
    expect(selectedCell).toHaveClass("today");

    // Click handlers
    fireEvent.click(title1);
    expect(onTitle).toHaveBeenCalledWith("r1");

    fireEvent.click(screen.getByTestId("cell-r1-2023-01-01"));
    expect(onCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r1",
        date: "2023-01-01",
        dayType: "arrival",
      })
    );

    fireEvent.click(screen.getByTestId("cell-r2-2023-01-02"));
    expect(onCell).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "r2",
        date: "2023-01-02",
        dayType: "arrival",
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

    expect(screen.getByTestId("title")).toHaveTextContent("Rooms");
    // Selected column
    const sel = screen.getByTestId("cell-day-2023-01-01");
    expect(sel).toHaveClass("selected");
    // Today highlight
    const today = screen.getByTestId("cell-day-2023-01-02");
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

    expect(screen.queryByTestId("info-r1")).not.toBeInTheDocument();
  });
});
