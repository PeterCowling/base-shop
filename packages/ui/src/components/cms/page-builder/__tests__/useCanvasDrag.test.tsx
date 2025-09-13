import { render, fireEvent } from "@testing-library/react";
import React from "react";
import useCanvasDrag from "../useCanvasDrag";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

test("dispatches raw coordinates when grid is disabled", () => {
  const dispatch = jest.fn();
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startDrag } = useCanvasDrag({
      componentId: "c1",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={startDrag} data-cy="box" />;
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

test("snaps dispatch to grid units when enabled", () => {
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
    return <div ref={ref} onPointerDown={startDrag} data-cy="box" />;
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

test("aligns to sibling edges and sets guides/distances", () => {
  const dispatch = jest.fn();
  let guides: { x: number | null; y: number | null } | null = null;
  let distances: { x: number | null; y: number | null } | null = null;

  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startDrag, guides: g, distances: d } = useCanvasDrag({
      componentId: "c1",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    });
    guides = g;
    distances = d;
    return (
      <div>
        <div data-cy="sibling" />
        <div ref={ref} onPointerDown={startDrag} data-cy="box" />
      </div>
    );
  }

  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  const sibling = getByTestId("sibling") as HTMLElement;

  // Mock layout metrics
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  Object.defineProperty(sibling, "offsetLeft", { value: 200, writable: true });
  Object.defineProperty(sibling, "offsetTop", { value: 150, writable: true });
  Object.defineProperty(sibling, "offsetWidth", { value: 50, writable: true });
  Object.defineProperty(sibling, "offsetHeight", { value: 50, writable: true });

  fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
  fireEvent.pointerMove(window, { clientX: 195, clientY: 145 });

  expect(guides).toEqual({ x: 0, y: 0 });
  expect(distances).toEqual({ x: 5, y: 5 });
  fireEvent.pointerUp(window);
});

test("disabled prevents drag start", () => {
  const dispatch = jest.fn();
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startDrag } = useCanvasDrag({
      componentId: "c1",
      dispatch,
      gridCols: 12,
      containerRef: ref,
      disabled: true,
    });
    return <div ref={ref} onPointerDown={startDrag} data-cy="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
  fireEvent.pointerMove(window, { clientX: 50, clientY: 50 });
  expect(dispatch).not.toHaveBeenCalled();
});

test("removes listeners on unmount", () => {
  const dispatch = jest.fn();
  const addSpy = jest.spyOn(window, "addEventListener");
  const removeSpy = jest.spyOn(window, "removeEventListener");
  function Wrapper() {
    const ref = React.useRef<HTMLDivElement>(null);
    const { startDrag } = useCanvasDrag({
      componentId: "c1",
      dispatch,
      gridCols: 12,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={startDrag} data-cy="box" />;
  }
  const { getByTestId, unmount } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
  const moveHandler = addSpy.mock.calls.find(c => c[0] === "pointermove")?.[1];
  const upHandler = addSpy.mock.calls.find(c => c[0] === "pointerup")?.[1];
  unmount();
  expect(removeSpy).toHaveBeenCalledWith("pointermove", moveHandler);
  expect(removeSpy).toHaveBeenCalledWith("pointerup", upHandler);
  addSpy.mockRestore();
  removeSpy.mockRestore();
});
