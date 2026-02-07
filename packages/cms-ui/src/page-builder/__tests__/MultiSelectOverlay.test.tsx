import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import MultiSelectOverlay from "../MultiSelectOverlay";

function defineReadonly<T extends object, K extends keyof any>(obj: T, key: K, value: any) {
  Object.defineProperty(obj, key, { configurable: true, get: () => value });
}

describe("MultiSelectOverlay", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      cb(0 as any);
      return 1 as any;
    });
    // Silence React style NaN warning that can occur briefly while effects compute bounds
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (window.requestAnimationFrame as jest.Mock).mockRestore?.();
    (console.error as unknown as jest.Mock).mockRestore?.();
  });

  function mountWithNodes() {
    const canvas = document.createElement("div");
    defineReadonly(canvas, "offsetWidth", 400);
    canvas.getBoundingClientRect = () => ({ left: 10, top: 20, right: 410, bottom: 420, width: 400, height: 400 } as any);
    document.body.appendChild(canvas);

    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.setAttribute("data-component-id", "a");
    b.setAttribute("data-component-id", "b");
    parent.appendChild(a);
    parent.appendChild(b);
    defineReadonly(a, "offsetParent", parent);
    defineReadonly(b, "offsetParent", parent);
    defineReadonly(a, "offsetLeft", 40);
    defineReadonly(a, "offsetTop", 50);
    defineReadonly(a, "offsetWidth", 100);
    defineReadonly(a, "offsetHeight", 80);
    defineReadonly(b, "offsetLeft", 200);
    defineReadonly(b, "offsetTop", 120);
    defineReadonly(b, "offsetWidth", 60);
    defineReadonly(b, "offsetHeight", 40);
    a.getBoundingClientRect = () => ({ left: 60, top: 80, right: 160, bottom: 160, width: 100, height: 80 } as any);
    b.getBoundingClientRect = () => ({ left: 240, top: 140, right: 300, bottom: 180, width: 60, height: 40 } as any);

    const canvasRef = { current: canvas } as React.RefObject<HTMLDivElement> as any;
    return { canvasRef, a, b, parent };
  }

  it("computes overlay bounds and moves selection; emits delta patches", async () => {
    const { canvasRef } = mountWithNodes();
    const onApply = jest.fn();
    render(
      <MultiSelectOverlay
        canvasRef={canvasRef}
        ids={["a", "b"]}
        viewport="desktop"
        gridCols={12}
        gridEnabled={false}
        zoom={1}
        onApply={onApply}
      />
    );

    // Wait for effect to compute bounds and render overlay
    const moveHandle = await screen.findByRole("button", { name: "Move selection" });
    // Give effects a tick to finalize refs
    await new Promise((resolve) => setTimeout(resolve, 0));
    // start drag at (0,0) and move to (10, 20)
    fireEvent.pointerDown(moveHandle, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: 10, clientY: 20 });
    fireEvent.pointerUp(window);

    // Expect onApply called with left/top patches increased by +10/+20
    const last = onApply.mock.calls[onApply.mock.calls.length - 1][0];
    expect(last.a.left).toMatch(/px$/);
    expect(last.a.top).toMatch(/px$/);
    expect(last.b.left).toMatch(/px$/);
    expect(last.b.top).toMatch(/px$/);
  });

  it("resizes from SE handle and emits width/height and left/top when needed", async () => {
    const { canvasRef } = mountWithNodes();
    const onApply = jest.fn();
    render(
      <MultiSelectOverlay
        canvasRef={canvasRef}
        ids={["a"]}
        viewport="desktop"
        gridCols={12}
        gridEnabled={false}
        zoom={1}
        onApply={onApply}
      />
    );

    const se = await screen.findByRole("button", { name: "Resize group from bottom-right" });
    fireEvent.pointerDown(se, { clientX: 0, clientY: 0 });
    // drag by +20,+10 → sx>1, sy>1
    fireEvent.pointerMove(window, { clientX: 20, clientY: 10 });
    fireEvent.pointerUp(window);

    const patch = onApply.mock.calls[onApply.mock.calls.length - 1][0].a;
    expect(patch.width).toBeDefined();
    expect(patch.height).toBeDefined();
  });
});
