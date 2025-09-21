import { render, fireEvent } from "@testing-library/react";
import React from "react";
import BlockResizer from "../BlockResizer";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("BlockResizer", () => {
  it("returns null when not selected", () => {
    const { container } = render(
      <BlockResizer
        selected={false}
        startResize={jest.fn()}
        startSpacing={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("fires startResize on all corner handles", () => {
    const startResize = jest.fn();
    const { container } = render(
      <BlockResizer
        selected
        startResize={startResize}
        startSpacing={jest.fn()}
      />
    );
    const corners = Array.from(container.children).slice(0, 4) as HTMLElement[];
    const expectedHandles = ["nw", "ne", "sw", "se"] as const;
    corners.forEach((corner, idx) => {
      fireEvent.pointerDown(corner);
      expect(startResize).toHaveBeenNthCalledWith(
        idx + 1,
        expect.objectContaining({ type: "pointerdown" }),
        expectedHandles[idx]
      );
    });
  });

  it("fires startSpacing on all handles with expected args", () => {
    const startSpacing = jest.fn();
    const { container } = render(
      <BlockResizer
        selected
        startResize={jest.fn()}
        startSpacing={startSpacing}
      />
    );
    // Skip 4 corner and 4 side resize handles; verify spacing handles only
    const handles = Array.from(container.children).slice(8) as HTMLElement[];
    const expected: Array<
      ["margin" | "padding", "top" | "bottom" | "left" | "right"]
    > = [
      ["margin", "top"],
      ["margin", "bottom"],
      ["margin", "left"],
      ["margin", "right"],
      ["padding", "top"],
      ["padding", "bottom"],
      ["padding", "left"],
      ["padding", "right"],
    ];
    handles.forEach((handle, idx) => {
      fireEvent.pointerDown(handle);
      expect(startSpacing).toHaveBeenNthCalledWith(
        idx + 1,
        expect.objectContaining({ type: "pointerdown" }),
        expected[idx][0],
        expected[idx][1]
      );
    });
    expect(startSpacing).toHaveBeenCalledTimes(expected.length);
  });
});
