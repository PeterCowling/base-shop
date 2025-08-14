import { render, fireEvent } from "@testing-library/react";
import React from "react";
import useCanvasDrag from "../useCanvasDrag";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

test("moves element", () => {
  const dispatch = jest.fn();
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startDrag } = useCanvasDrag({
      componentId: "c1",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={startDrag} data-testid="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
  fireEvent.pointerMove(window, { clientX: 50, clientY: 60 });
  fireEvent.pointerUp(window);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ left: "50px", top: "60px" })
  );
});

test("snaps to grid units", () => {
  const dispatch = jest.fn();
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startDrag } = useCanvasDrag({
      componentId: "c1",
      dispatch,
      gridEnabled: true,
      gridCols: 4,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={startDrag} data-testid="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  const parent = box.parentElement as HTMLElement;
  Object.defineProperty(parent, "offsetWidth", { value: 400, writable: true });
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
  fireEvent.pointerMove(window, { clientX: 130, clientY: 130 });
  fireEvent.pointerUp(window);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ left: "100px", top: "100px" })
  );
});
