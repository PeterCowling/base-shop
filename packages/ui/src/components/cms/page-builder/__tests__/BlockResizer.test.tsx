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

  it("fires resize and spacing callbacks", () => {
    const startResize = jest.fn();
    const startSpacing = jest.fn();
    const { container } = render(
      <BlockResizer selected startResize={startResize} startSpacing={startSpacing} />
    );
    const resizeHandle = container.firstChild as HTMLElement;
    const spacingHandle = container.children[4] as HTMLElement;
    fireEvent.pointerDown(resizeHandle);
    fireEvent.pointerDown(spacingHandle);
    expect(startResize).toHaveBeenCalled();
    expect(startResize.mock.calls[0][0].type).toBe("pointerdown");
    const spacingArgs = startSpacing.mock.calls[0];
    expect(spacingArgs[0].type).toBe("pointerdown");
    expect(spacingArgs[1]).toBe("margin");
    expect(spacingArgs[2]).toBe("top");
  });
});
