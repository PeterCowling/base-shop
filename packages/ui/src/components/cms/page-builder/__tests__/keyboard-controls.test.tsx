import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";

// Reuse the same mocking pattern as BlockItem tests
const useBlockDnDMock = jest.fn(() => ({
  attributes: {},
  listeners: {},
  setNodeRef: jest.fn(),
  transform: null,
  isDragging: false,
  setDropRef: jest.fn(),
  isOver: false,
  containerRef: { current: null },
}));

jest.mock("../useBlockDnD", () => ({
  __esModule: true,
  default: () => useBlockDnDMock(),
}));

const useCanvasResizeMock = jest.fn();
jest.mock("../useCanvasResize", () => ({
  __esModule: true,
  default: (args: any) => useCanvasResizeMock(args),
}));

const useCanvasDragMock = jest.fn();
jest.mock("../useCanvasDrag", () => ({
  __esModule: true,
  default: (args: any) => useCanvasDragMock(args),
}));

const useCanvasSpacingMock = jest.fn();
jest.mock("../useCanvasSpacing", () => ({
  __esModule: true,
  default: (args: any) => useCanvasSpacingMock(args),
}));

const useBlockDimensionsMock = jest.fn();
jest.mock("../useBlockDimensions", () => ({
  __esModule: true,
  default: (args: any) => useBlockDimensionsMock(args),
}));

jest.mock("../Block", () => ({
  __esModule: true,
  default: () => <div>block</div>,
}));

jest.mock("../BlockChildren", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../BlockResizer", () => ({
  __esModule: true,
  default: () => null,
}));

import BlockItem from "../BlockItem";

describe("Keyboard controls: resize and spacing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBlockDimensionsMock.mockReturnValue({
      widthKey: "width",
      heightKey: "height",
      widthVal: "100px",
      heightVal: "50px",
      marginKey: "margin",
      paddingKey: "padding",
      marginVal: "0",
      paddingVal: "0",
    });
    useCanvasResizeMock.mockReturnValue({
      startResize: jest.fn(),
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 100,
      height: 50,
      left: 10,
      top: 20,
      resizing: false,
      kbResizing: false,
      nudgeByKeyboard: jest.fn(),
    });
    useCanvasDragMock.mockReturnValue({
      startDrag: jest.fn(),
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 100,
      height: 50,
      left: 10,
      top: 20,
      moving: false,
    });
    useCanvasSpacingMock.mockReturnValue({
      startSpacing: jest.fn(),
      overlay: null,
      nudgeSpacingByKeyboard: jest.fn(),
    });
  });

  const baseComponent = {
    id: "1",
    type: "Button" as const,
    label: "Btn",
  };

  const renderItem = (props: any = {}) =>
    render(
      <BlockItem
        component={baseComponent}
        index={0}
        parentId={undefined}
        selectedIds={["1"]}
        onSelect={jest.fn()}
        onRemove={jest.fn()}
        dispatch={jest.fn()}
        locale="en"
        gridCols={12}
        viewport="desktop"
        {...props}
      />
    );

  it("resizes with Shift+ArrowRight using 1px step when not snapping", () => {
    renderItem();
    const el = screen.getByRole("listitem");
    fireEvent.keyDown(el, { key: "ArrowRight", shiftKey: true });
    const { nudgeByKeyboard } = useCanvasResizeMock.mock.results[useCanvasResizeMock.mock.calls.length - 1].value;
    expect(nudgeByKeyboard).toHaveBeenCalledWith("right", 1);
  });

  it("adjusts margin with Ctrl+ArrowUp (−1)", () => {
    renderItem();
    const el = screen.getByRole("listitem");
    fireEvent.keyDown(el, { key: "ArrowUp", ctrlKey: true });
    const { nudgeSpacingByKeyboard } = useCanvasSpacingMock.mock.results[useCanvasSpacingMock.mock.calls.length - 1].value;
    expect(nudgeSpacingByKeyboard).toHaveBeenCalledWith("margin", "top", -1);
  });

  it("adjusts padding with Ctrl+Alt+ArrowLeft using grid unit when snapping", () => {
    // Provide a containerRef with a parent width to compute unit
    useBlockDnDMock.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      isDragging: false,
      setDropRef: jest.fn(),
      isOver: false,
      // Simulate an element with a parent of width 1200
      containerRef: { current: { parentElement: { offsetWidth: 1200 } } },
    });
    renderItem({ gridEnabled: true, gridCols: 12 });
    const el = screen.getByRole("listitem");
    fireEvent.keyDown(el, { key: "ArrowLeft", ctrlKey: true, altKey: true });
    const { nudgeSpacingByKeyboard } = useCanvasSpacingMock.mock.results[useCanvasSpacingMock.mock.calls.length - 1].value;
    // unit = 1200 / 12 = 100, ArrowLeft => negative delta
    expect(nudgeSpacingByKeyboard).toHaveBeenCalledWith("padding", "left", -100);
  });

});
