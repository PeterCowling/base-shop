import { render, fireEvent } from "@testing-library/react";
import React from "react";
import useCanvasResize from "../useCanvasResize";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

test("resizes without grid and no guides", () => {
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
    return <div ref={ref} onPointerDown={hook.startResize} data-cy="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  const parent = box.parentElement as HTMLElement;
  Object.defineProperty(parent, "offsetWidth", { value: 1000, writable: true });
  Object.defineProperty(parent, "offsetHeight", { value: 1000, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  fireEvent.pointerDown(box, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ widthDesktop: "150px", heightDesktop: "150px" })
  );
  expect(hook.guides).toEqual({ x: null, y: null });
  fireEvent.pointerUp(window);
});

test("snaps to grid units and sets guides", () => {
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
      gridEnabled: true,
      gridCols: 4,
      containerRef: ref,
    });
    return <div ref={ref} onPointerDown={hook.startResize} data-cy="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  const parent = box.parentElement as HTMLElement;
  Object.defineProperty(parent, "offsetWidth", { value: 400, writable: true });
  Object.defineProperty(parent, "offsetHeight", { value: 400, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  fireEvent.pointerDown(box, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, { clientX: 190, clientY: 190 });
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ widthDesktop: "200px", heightDesktop: "200px" })
  );
  expect(hook.guides).toEqual({ x: 200, y: 200 });
  fireEvent.pointerUp(window);
});

test("Alt key snaps to full width and height", () => {
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
    return <div ref={ref} onPointerDown={hook.startResize} data-cy="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  const parent = box.parentElement as HTMLElement;
  Object.defineProperty(parent, "offsetWidth", { value: 400, writable: true });
  Object.defineProperty(parent, "offsetHeight", { value: 400, writable: true });
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  Object.defineProperty(box, "offsetLeft", { value: 0, writable: true });
  Object.defineProperty(box, "offsetTop", { value: 0, writable: true });
  fireEvent.pointerDown(box, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, {
    clientX: 150,
    clientY: 150,
    altKey: true,
  });
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ widthDesktop: "100%", heightDesktop: "100%" })
  );
  expect(hook.snapping).toBe(true);
  expect(hook.guides).toEqual({ x: null, y: null });
  fireEvent.pointerUp(window);
});

test("disabled short-circuits startResize", () => {
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
      disabled: true,
    });
    return <div ref={ref} onPointerDown={hook.startResize} data-cy="box" />;
  }
  const { getByTestId } = render(<Wrapper />);
  const box = getByTestId("box") as HTMLElement;
  Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
  Object.defineProperty(box, "offsetHeight", { value: 100, writable: true });
  fireEvent.pointerDown(box, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });
  fireEvent.pointerUp(window);
  expect(dispatch).not.toHaveBeenCalled();
  expect(hook.resizing).toBe(false);
});
