import { renderHook, act } from "@testing-library/react";
import { useRef } from "react";
import { usePositions } from "../comments/usePositions";

describe("comments/usePositions", () => {
  it("calculates positions relative to canvas", () => {
    const canvas = document.createElement("div");
    canvas.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      right: 210,
      bottom: 120,
      width: 200,
      height: 100,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as any);

    const c1 = document.createElement("div");
    c1.setAttribute("data-component-id", "c1");
    c1.getBoundingClientRect = () => ({
      left: 30,
      top: 50,
      right: 130,
      bottom: 90,
      width: 100,
      height: 40,
      x: 30,
      y: 50,
      toJSON: () => ({}),
    } as any);

    const c2 = document.createElement("div");
    c2.setAttribute("data-component-id", "c2");
    c2.getBoundingClientRect = () => ({
      left: 5, // results in max(0, 5 - 10) = 0
      top: 15, // results in max(0, 15 - 20) = 0
      right: 55,
      bottom: 65,
      width: 50,
      height: 50,
      x: 5,
      y: 15,
      toJSON: () => ({}),
    } as any);

    canvas.appendChild(c1);
    canvas.appendChild(c2);

    const ref = { current: canvas } as React.RefObject<HTMLDivElement>;
    const { result } = renderHook(() => usePositions(ref));

    act(() => {
      result.current.recalcPositions();
    });

    expect(result.current.positions.current).toEqual({
      c1: { left: 20, top: 30, width: 100, height: 40 },
      c2: { left: 0, top: 0, width: 50, height: 50 },
    });
  });
});

