import { render, fireEvent } from "@testing-library/react";
import React from "react";
import useCanvasSpacing from "../useCanvasSpacing";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("useCanvasSpacing", () => {
  test("adjusts padding and overlay", () => {
    const dispatch = jest.fn();
    let hook: ReturnType<typeof useCanvasSpacing> | undefined;
    function Wrapper() {
      const ref = React.useRef<HTMLDivElement>(null);
      hook = useCanvasSpacing({
        componentId: "c1",
        marginKey: "marginDesktop",
        paddingKey: "paddingDesktop",
        marginVal: "0px",
        paddingVal: "10px",
        dispatch,
        containerRef: ref,
      });
      return (
        <div
          ref={ref}
          data-cy="box"
          onPointerDown={(e) => hook!.startSpacing(e, "padding", "top")}
        />
      );
    }
    const { getByTestId } = render(<Wrapper />);
    const box = getByTestId("box") as HTMLElement;
    Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(box, "offsetHeight", { value: 50, writable: true });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 5 });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ paddingDesktop: "15px 10px 10px 10px" })
    );
    expect(hook!.overlay).toEqual({
      type: "padding",
      side: "top",
      top: 0,
      left: 0,
      width: 100,
      height: 15,
    });
  });

  test("clamps padding to zero", () => {
    const dispatch = jest.fn();
    let hook: ReturnType<typeof useCanvasSpacing> | undefined;
    function Wrapper() {
      const ref = React.useRef<HTMLDivElement>(null);
      hook = useCanvasSpacing({
        componentId: "c1",
        marginKey: "marginDesktop",
        paddingKey: "paddingDesktop",
        marginVal: "0px",
        paddingVal: "5px",
        dispatch,
        containerRef: ref,
      });
      return (
        <div
          ref={ref}
          data-cy="box"
          onPointerDown={(e) => hook!.startSpacing(e, "padding", "left")}
        />
      );
    }
    const { getByTestId } = render(<Wrapper />);
    const box = getByTestId("box") as HTMLElement;
    Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(box, "offsetHeight", { value: 50, writable: true });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: -10, clientY: 0 });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ paddingDesktop: "5px 5px 5px 0px" })
    );
    expect(hook!.overlay).toMatchObject({
      type: "padding",
      side: "left",
      width: 0,
    });
  });

  test("updates margin overlay", () => {
    const dispatch = jest.fn();
    let hook: ReturnType<typeof useCanvasSpacing> | undefined;
    function Wrapper() {
      const ref = React.useRef<HTMLDivElement>(null);
      hook = useCanvasSpacing({
        componentId: "c1",
        marginKey: "marginDesktop",
        paddingKey: "paddingDesktop",
        marginVal: "10px",
        paddingVal: "0px",
        dispatch,
        containerRef: ref,
      });
      return (
        <div
          ref={ref}
          data-cy="box"
          onPointerDown={(e) => hook!.startSpacing(e, "margin", "top")}
        />
      );
    }
    const { getByTestId } = render(<Wrapper />);
    const box = getByTestId("box") as HTMLElement;
    Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(box, "offsetHeight", { value: 50, writable: true });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 0, clientY: 20 });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ marginDesktop: "30px 10px 10px 10px" })
    );
    expect(hook!.overlay).toEqual({
      type: "margin",
      side: "top",
      top: -30,
      left: 0,
      width: 100,
      height: 30,
    });
  });
});
