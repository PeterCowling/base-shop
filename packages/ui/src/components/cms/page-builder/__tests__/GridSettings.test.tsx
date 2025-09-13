import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import GridSettings from "../GridSettings";

describe("GridSettings", () => {
  it("calls toggleGrid when button clicked", () => {
    const toggleGrid = jest.fn();
    const setGridCols = jest.fn();
    render(
      <GridSettings
        showGrid={false}
        toggleGrid={toggleGrid}
        gridCols={4}
        setGridCols={setGridCols}
      />,
    );
    const button = screen.getByRole("button", { name: "Show grid" });
    fireEvent.click(button);
    expect(toggleGrid).toHaveBeenCalled();
  });

  it("parses input value as number", () => {
    const toggleGrid = jest.fn();
    const setGridCols = jest.fn();
    render(
      <GridSettings
        showGrid
        toggleGrid={toggleGrid}
        gridCols={8}
        setGridCols={setGridCols}
      />,
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "12" } });
    expect(setGridCols).toHaveBeenCalledWith(12);
  });
});

