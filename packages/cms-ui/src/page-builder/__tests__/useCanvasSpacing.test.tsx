import React from "react";
import { fireEvent,render } from "@testing-library/react";

import useCanvasSpacing, { parseSpacing } from "../useCanvasSpacing";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("parseSpacing", () => {
  test.each([
    ["10px", [10, 10, 10, 10]],
    ["10px 20px", [10, 20, 10, 20]],
    ["10px 20px 30px", [10, 20, 30, 20]],
    ["10px 20px 30px 40px", [10, 20, 30, 40]],
  ])("parses %s", (input, expected) => {
    expect(parseSpacing(input as string)).toEqual(expected);
  });
});

describe("startSpacing", () => {
  function run(
    type: "margin" | "padding",
    side: "top" | "right" | "bottom" | "left",
    move: { clientX: number; clientY: number },
    expectedPatch: string,
    overlay: { top: number; left: number; width: number; height: number }
  ) {
    const dispatch = jest.fn();
    let hook: ReturnType<typeof useCanvasSpacing> | undefined;
    function Wrapper() {
      const ref = React.useRef<HTMLDivElement>(null);
      hook = useCanvasSpacing({
        componentId: "c1",
        marginKey: "marginDesktop",
        paddingKey: "paddingDesktop",
        marginVal: "10px",
        paddingVal: "10px",
        dispatch,
        containerRef: ref,
      });
      return (
        <div
          ref={ref}
          data-cy="box"
          onPointerDown={(e) => hook!.startSpacing(e, type, side)}
        />
      );
    }
    const { getByTestId } = render(<Wrapper />);
    const box = getByTestId("box") as HTMLElement;
    Object.defineProperty(box, "offsetWidth", { value: 100, writable: true });
    Object.defineProperty(box, "offsetHeight", { value: 50, writable: true });
    fireEvent.pointerDown(box, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, move);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining(
        type === "margin"
          ? { marginDesktop: expectedPatch }
          : { paddingDesktop: expectedPatch }
      )
    );
    expect(hook!.overlay).toEqual({ type, side, ...overlay });
  }

  describe("padding", () => {
    test.each([
      [
        "top",
        { clientX: 0, clientY: 5 },
        "15px 10px 10px 10px",
        { top: 0, left: 0, width: 100, height: 15 },
      ],
      [
        "right",
        { clientX: 5, clientY: 0 },
        "10px 15px 10px 10px",
        { top: 0, left: 85, width: 15, height: 50 },
      ],
      [
        "bottom",
        { clientX: 0, clientY: 5 },
        "10px 10px 15px 10px",
        { top: 35, left: 0, width: 100, height: 15 },
      ],
      [
        "left",
        { clientX: 5, clientY: 0 },
        "10px 10px 10px 15px",
        { top: 0, left: 0, width: 15, height: 50 },
      ],
    ])("adjusts %s", (side, move, patch, o) => {
      run("padding", side as any, move as any, patch as string, o as any);
    });

    test("clamps to zero", () => {
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
  });

  describe("margin", () => {
    test.each([
      [
        "top",
        { clientX: 0, clientY: 20 },
        "30px 10px 10px 10px",
        { top: -30, left: 0, width: 100, height: 30 },
      ],
      [
        "right",
        { clientX: 20, clientY: 0 },
        "10px 30px 10px 10px",
        { top: 0, left: 100, width: 30, height: 50 },
      ],
      [
        "bottom",
        { clientX: 0, clientY: 20 },
        "10px 10px 30px 10px",
        { top: 50, left: 0, width: 100, height: 30 },
      ],
      [
        "left",
        { clientX: 20, clientY: 0 },
        "10px 10px 10px 30px",
        { top: 0, left: -30, width: 30, height: 50 },
      ],
    ])("adjusts %s", (side, move, patch, o) => {
      run("margin", side as any, move as any, patch as string, o as any);
    });
  });
});
