// packages/ui/src/components/cms/page-builder/hooks/__tests__/useDropHighlight.test.tsx
import { act,renderHook } from "@testing-library/react";

import useDropHighlight from "../useDropHighlight";

describe("useDropHighlight", () => {
  test("computes dropRect from listitem within canvas", () => {
    const canvas = document.createElement("div");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    // mock canvas rect
    (canvas as any).getBoundingClientRect = () => ({ left: 10, top: 20, width: 800, height: 600 });
    const item = document.createElement("div");
    item.setAttribute("role", "listitem");
    (item as any).closest = (sel: string) => (sel.includes("listitem") ? item : canvas);
    (item as any).getBoundingClientRect = () => ({ left: 110, top: 120, width: 200, height: 100 });
    const setDragOver = jest.fn();
    const { result } = renderHook(() => useDropHighlight({ preview: false, canvasRef: { current: canvas } as any, zoom: 2, setDragOver }));
    act(() => {
      const e: any = { preventDefault: () => {}, target: item };
      result.current.handleDragOver(e);
    });
    expect(setDragOver).toHaveBeenCalledWith(true);
    // With zoom=2 and canvas origin at (10,20), left=(110-10)/2=50, top=(120-20)/2=50
    expect(result.current.dropRect).toEqual({ left: 50, top: 50, width: 100, height: 50 });
  });

  test("preview mode does nothing", () => {
    const { result } = renderHook(() => useDropHighlight({ preview: true, canvasRef: { current: null } as any, zoom: 1, setDragOver: jest.fn() }));
    act(() => result.current.handleDragOver({ preventDefault: () => {} } as any));
    expect(result.current.dropRect).toBeNull();
  });
});

