import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";

// Mocks mirroring BlockItem.test.tsx setup
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
  default: (args: any) => useCanvasResizeMock(args) || {
    startResize: jest.fn(),
    guides: { x: null, y: null },
    distances: { x: null, y: null },
    snapping: false,
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    resizing: false,
  },
}));

const useCanvasDragMock = jest.fn();
jest.mock("../useCanvasDrag", () => ({
  __esModule: true,
  default: (args: any) => useCanvasDragMock(args) || {
    startDrag: jest.fn(),
    guides: { x: null, y: null },
    distances: { x: null, y: null },
    snapping: false,
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    moving: false,
  },
}));

const useCanvasSpacingMock = jest.fn();
jest.mock("../useCanvasSpacing", () => ({
  __esModule: true,
  default: (args: any) => useCanvasSpacingMock(args) || { startSpacing: jest.fn(), overlay: null },
}));

const useBlockDimensionsMock = jest.fn();
jest.mock("../useBlockDimensions", () => ({
  __esModule: true,
  default: (args: any) => useBlockDimensionsMock(args) || ({
    widthKey: "width",
    heightKey: "height",
    widthVal: "auto",
    heightVal: "auto",
    marginKey: "margin",
    paddingKey: "padding",
    marginVal: "0",
    paddingVal: "0",
  }),
}));

jest.mock("../BlockChildren", () => ({ __esModule: true, default: () => null }));
jest.mock("../BlockResizer", () => ({ __esModule: true, default: () => null }));

import BlockItem from "../BlockItem";

describe("Inline Button editor (BlockItem)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderButton(overrides: Partial<any> = {}, extraProps: Partial<any> = {}) {
    const component = { id: "b1", type: "Button", label: "Buy", ...overrides } as const;
    const dispatch = jest.fn();
    render(
      <BlockItem
        component={component as any}
        index={0}
        parentId={undefined}
        selectedIds={[component.id]}
        onSelect={jest.fn()}
        onRemove={jest.fn()}
        dispatch={dispatch}
        locale="en"
        gridCols={12}
        viewport="desktop"
        {...extraProps}
      />
    );
    return { component, dispatch };
  }

  it("commits label on blur via dispatch(update)", () => {
    const { component, dispatch } = renderButton();
    const span = screen.getByRole("textbox", { name: "Edit button label" });
    // Start editing
    fireEvent.click(span);
    // Update contentEditable value
    span.textContent = "New Label";
    fireEvent.input(span);
    // Blur should commit
    fireEvent.blur(span);
    expect(dispatch).toHaveBeenCalledWith({
      type: "update",
      id: component.id,
      patch: { label: "New Label" },
    });
  });

  it("commits label on Enter key", () => {
    const { component, dispatch } = renderButton();
    const span = screen.getByRole("textbox", { name: "Edit button label" });
    fireEvent.click(span);
    span.textContent = "Enter Label";
    fireEvent.input(span);
    fireEvent.keyDown(span, { key: "Enter" });
    expect(dispatch).toHaveBeenCalledWith({
      type: "update",
      id: component.id,
      patch: { label: "Enter Label" },
    });
  });

  it("disables drag/resize while editing", () => {
    renderButton();
    // First invocation is with disabled=false
    const firstDragArgs = useCanvasDragMock.mock.calls[0]?.[0] ?? {};
    const firstResizeArgs = useCanvasResizeMock.mock.calls[0]?.[0] ?? {};
    expect(firstDragArgs.disabled).toBeFalsy();
    expect(firstResizeArgs.disabled).toBeFalsy();

    // Start editing -> component rerenders with disabled=true
    const span = screen.getByRole("textbox", { name: "Edit button label" });
    fireEvent.click(span);

    const lastDragArgs = useCanvasDragMock.mock.calls.at(-1)?.[0] ?? {};
    const lastResizeArgs = useCanvasResizeMock.mock.calls.at(-1)?.[0] ?? {};
    expect(lastDragArgs.disabled).toBeTruthy();
    expect(lastResizeArgs.disabled).toBeTruthy();
  });
});

