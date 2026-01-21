import React from "react";
import { act,render } from "@testing-library/react";

import useCanvasResize from "../useCanvasResize";

// Ensure PointerEvent exists in jsdom env
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("useCanvasResize keyboard nudge", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("nudges width/height by step and toggles kbResizing overlay", () => {
    const dispatch = jest.fn();
    let hook: ReturnType<typeof useCanvasResize>;
    function Wrapper() {
      const ref = React.useRef<HTMLDivElement>(null);
      hook = useCanvasResize({
        componentId: "c1",
        widthKey: "widthDesktop",
        heightKey: "heightDesktop",
        widthVal: "100px",
        heightVal: "100px",
        dispatch,
        gridCols: 12,
        containerRef: ref,
      });
      // Dimensions aren't needed for this test; avoid inline style on DOM.
      return <div ref={ref} />;
    }
    render(<Wrapper />);

    act(() => {
      hook!.nudgeByKeyboard("right", 5);
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ widthDesktop: "105px", heightDesktop: "100px" })
    );
    expect(hook!.kbResizing).toBe(true);

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(hook!.kbResizing).toBe(false);
  });
});
