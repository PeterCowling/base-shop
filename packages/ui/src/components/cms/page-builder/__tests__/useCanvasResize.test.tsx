import { render, fireEvent } from "@testing-library/react";
import React from "react";
import useCanvasResize from "../useCanvasResize";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

test("resizes element", () => {
  const dispatch = jest.fn();
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startResize } = useCanvasResize({
      componentId: "c1",
      widthKey: "widthDesktop",
      heightKey: "heightDesktop",
      widthVal: "100px",
      heightVal: "100px",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={startResize} data-testid="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  fireEvent.pointerDown(box, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
  fireEvent.pointerUp(window);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ widthDesktop: "150px", heightDesktop: "150px" })
  );
});

test("snaps to grid units", () => {
  const dispatch = jest.fn();
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startResize } = useCanvasResize({
      componentId: "c1",
      widthKey: "widthDesktop",
      heightKey: "heightDesktop",
      widthVal: "100px",
      heightVal: "100px",
      dispatch,
      gridEnabled: true,
      gridCols: 4,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={startResize} data-testid="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  const parent = box.parentElement as HTMLElement;
  Object.defineProperty(parent, "offsetWidth", { value: 400, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  fireEvent.pointerDown(box, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, { clientX: 175, clientY: 175 });
  fireEvent.pointerUp(window);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ widthDesktop: "200px", heightDesktop: "200px" })
  );
});
