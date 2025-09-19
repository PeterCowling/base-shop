import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const useCanvasDragMock = jest.fn((args: any) => ({
  startDrag: () => args.dispatch({ type: "drag", id: args.componentId }),
  guides: { x: null, y: null },
  distances: { x: null, y: null },
  snapping: false,
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  moving: false,
}));

jest.mock("../useCanvasDrag", () => ({
  __esModule: true,
  default: (args: any) => useCanvasDragMock(args),
}));

const useCanvasResizeMock = jest.fn((args: any) => ({
  startResize: () => args.dispatch({ type: "resize", id: args.componentId }),
  guides: { x: null, y: null },
  distances: { x: null, y: null },
  snapping: false,
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  resizing: false,
}));

jest.mock("../useCanvasResize", () => ({
  __esModule: true,
  default: (args: any) => useCanvasResizeMock(args),
}));

jest.mock("../useCanvasSpacing", () => ({
  __esModule: true,
  default: () => ({ startSpacing: jest.fn(), overlay: null }),
}));

jest.mock("../useBlockDnD", () => ({
  __esModule: true,
  default: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
    setDropRef: jest.fn(),
    isOver: false,
    containerRef: { current: null },
  }),
}));

jest.mock("../Block", () => ({
  __esModule: true,
  default: () => <div>block</div>,
}));

import PageCanvas from "../PageCanvas";

describe("PageCanvas", () => {
  it("invokes drag and resize callbacks", () => {
    const component = {
      id: "1",
      type: "Button" as const,
      label: "Btn",
      position: "absolute" as const,
    };
    const dispatch = jest.fn();
    const { container } = render(
      <PageCanvas
        components={[component]}
        selectedIds={["1"]}
        onSelectIds={jest.fn()}
        dispatch={dispatch}
        locale="en"
        containerStyle={{}}
        viewport="desktop"
      />
    );

    const handle = screen.getByTitle("Drag or press space/enter to move");
    fireEvent.pointerDown(handle);
    expect(dispatch).toHaveBeenCalledWith({ type: "drag", id: "1" });

    dispatch.mockClear();
    const resizer = container.querySelector(".cursor-nwse-resize") as HTMLElement;
    fireEvent.pointerDown(resizer);
    expect(dispatch).toHaveBeenCalledWith({ type: "resize", id: "1" });
  });
});
