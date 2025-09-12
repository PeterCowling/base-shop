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
      <BlockResizer selected={false} startResize={jest.fn()} startSpacing={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("fires startResize on all corner handles", () => {
    const startResize = jest.fn();
    const { container } = render(
      <BlockResizer selected startResize={startResize} startSpacing={jest.fn()} />
    );
    const corners = Array.from(container.children).slice(0, 4) as HTMLElement[];
    corners.forEach((corner, idx) => {
      fireEvent.pointerDown(corner);
      expect(startResize).toHaveBeenNthCalledWith(
        idx + 1,
        expect.objectContaining({ type: "pointerdown" })
      );
    });
  });

  it("fires startSpacing with expected args", () => {
    const startSpacing = jest.fn();
    const { container } = render(
      <BlockResizer selected startResize={jest.fn()} startSpacing={startSpacing} />
    );
    const handles = Array.from(container.children).slice(4) as HTMLElement[];
    const expected: ["margin" | "padding", "top" | "bottom" | "left" | "right"][] = [
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
      const call = startSpacing.mock.calls[idx];
      expect(call[0].type).toBe("pointerdown");
      expect(call[1]).toBe(expected[idx][0]);
      expect(call[2]).toBe(expected[idx][1]);
    });
  });
});
