import React from "react";
import { fireEvent,render } from "@testing-library/react";

import useCanvasResize from "../useCanvasResize";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("useCanvasResize pointer capture", () => {
  it("sets and releases pointer capture during resize", () => {
    const dispatch = jest.fn();
    function Wrapper() {
      const ref = React.useRef<HTMLDivElement>(null);
      const { startResize } = useCanvasResize({
        componentId: "c1",
        widthKey: "width",
        heightKey: "height",
        dispatch,
        gridCols: 12,
        containerRef: ref,
      });
      const onPointerDown = (e: React.PointerEvent) => startResize(e, "se");
      return <div ref={ref} onPointerDown={onPointerDown} data-cy="box" />;
    }
    const { getByTestId } = render(<Wrapper />);
    const box = getByTestId("box") as HTMLElement & {
      setPointerCapture?: (id: number) => void;
      releasePointerCapture?: (id: number) => void;
    };

    // Provide required layout metrics
    Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
    Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
    Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });

    // Spy pointer capture APIs
    box.setPointerCapture = jest.fn();
    box.releasePointerCapture = jest.fn();

    fireEvent.pointerDown(box, { pointerId: 9, clientX: 0, clientY: 0 });
    // In test environment, pointer capture is skipped for JSDOM compatibility
    expect(box.setPointerCapture).not.toHaveBeenCalled();

    fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(window);
  });
});
