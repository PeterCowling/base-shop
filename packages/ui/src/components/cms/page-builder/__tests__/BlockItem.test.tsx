import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";

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

describe("BlockItem", () => {
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
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      resizing: false,
    });
    useCanvasDragMock.mockReturnValue({
      startDrag: jest.fn(),
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      moving: false,
    });
    useCanvasSpacingMock.mockReturnValue({ startSpacing: jest.fn(), overlay: null });
  });

  const baseComponent = {
    id: "1",
    type: "Button" as const,
    label: "Btn",
  };

  const renderItem = (component = baseComponent, props: any = {}) =>
    render(
      <BlockItem
        component={component}
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

  it("fires onSelectId and onRemove", () => {
    const onSelect = jest.fn();
    const onRemove = jest.fn();
    renderItem(baseComponent, { onSelect, onRemove });

    fireEvent.click(screen.getByRole("listitem"));
    expect(onSelect).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("calls startDrag only when component position is absolute", () => {
    const startDrag = jest.fn();
    useCanvasDragMock.mockReturnValueOnce({
      startDrag,
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      moving: false,
    });
    const { unmount } = renderItem({
      ...baseComponent,
      position: "absolute" as const,
    });
    fireEvent.pointerDown(screen.getByTitle("Drag or press space/enter to move"));
    expect(startDrag).toHaveBeenCalled();
    unmount();

    const startDrag2 = jest.fn();
    useCanvasDragMock.mockReturnValueOnce({
      startDrag: startDrag2,
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      moving: false,
    });
    renderItem(baseComponent);
    fireEvent.pointerDown(screen.getByTitle("Drag or press space/enter to move"));
    expect(startDrag2).not.toHaveBeenCalled();
  });

  it("renders overlay when resizing is true", () => {
    useCanvasResizeMock.mockReturnValueOnce({
      startResize: jest.fn(),
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 100,
      height: 50,
      left: 10,
      top: 20,
      resizing: true,
    });
    renderItem(baseComponent);
    expect(screen.getByText(/100×50\s*px\s*\|\s*10,\s*20\s*px/)).toBeInTheDocument();
  });

  it("renders overlay when moving is true", () => {
    useCanvasDragMock.mockReturnValueOnce({
      startDrag: jest.fn(),
      guides: { x: null, y: null },
      distances: { x: null, y: null },
      snapping: false,
      width: 80,
      height: 40,
      left: 5,
      top: 7,
      moving: true,
    });
    renderItem(baseComponent);
    expect(screen.getByText(/80×40\s*px\s*\|\s*5,\s*7\s*px/)).toBeInTheDocument();
  });
});
